using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyProject.Backend.Data;
using MyProject.Backend.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MyProject.Backend.Controller
{
    [Route("api/[controller]")]
    [ApiController]
    public class CustomersController : ControllerBase
    {
        private const string CustomerCodePrefix = "KH00";
        private const int MaxCreateCustomerCodeAttempts = 10;
        private readonly AppDbContext _context;

        public CustomersController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Customers
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Customer>>> GetCustomers()
        {
            return await _context.Customers.ToListAsync();
        }

        // GET: api/Customers/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Customer>> GetCustomer(int id)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null) return NotFound();
            return customer;
        }

        // POST: api/Customers
        [HttpPost]
        public async Task<ActionResult<Customer>> PostCustomer(Customer customer)
        {
            var hasProvidedCustomerCode = !string.IsNullOrWhiteSpace(customer.CustomerCode);

            for (var attempt = 0; attempt < MaxCreateCustomerCodeAttempts; attempt++)
            {
                if (!hasProvidedCustomerCode)
                {
                    customer.CustomerCode = await GenerateNextCustomerCodeAsync();
                }
                else
                {
                    customer.CustomerCode = customer.CustomerCode?.Trim();
                }

                await using var transaction = await _context.Database.BeginTransactionAsync();

                customer.CreatedAt = DateTime.Now;
                customer.UpdatedAt = DateTime.Now;
                _context.Customers.Add(customer);

                try
                {
                    await _context.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return CreatedAtAction(nameof(GetCustomer), new { id = customer.ID }, customer);
                }
                catch (DbUpdateException ex) when (IsUniqueCustomerCodeException(ex))
                {
                    await transaction.RollbackAsync();
                    _context.Entry(customer).State = EntityState.Detached;
                    customer.ID = 0;

                    if (hasProvidedCustomerCode || attempt >= MaxCreateCustomerCodeAttempts - 1)
                    {
                        return Conflict("CustomerCode đã tồn tại.");
                    }

                    customer.CustomerCode = null;
                }
            }

            return StatusCode(500, "Không thể sinh CustomerCode không trùng sau nhiều lần thử.");
        }

        // PUT: api/Customers/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutCustomer(int id, Customer customer)
        {
            if (id != customer.ID) return BadRequest("ID không khớp.");

            var existing = await _context.Customers.AsNoTracking().FirstOrDefaultAsync(c => c.ID == id);
            if (existing == null) return NotFound();

            customer.UpdatedAt = DateTime.Now;
            customer.CreatedAt = existing.CreatedAt; // Giữ nguyên ngày tạo gốc

            customer.CustomerCode = string.IsNullOrWhiteSpace(existing.CustomerCode)
                ? await GenerateNextCustomerCodeAsync()
                : existing.CustomerCode;

            _context.Entry(customer).State = EntityState.Modified;
            _context.Entry(customer).Property(x => x.CreatedAt).IsModified = false;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!CustomerExists(id)) return NotFound();
                else throw;
            }

            return Ok(customer);
        }

        // DELETE: api/Customers/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCustomer(int id)
        {
            var customer = await _context.Customers.FindAsync(id);
            if (customer == null) return NotFound();

            _context.Customers.Remove(customer);
            await _context.SaveChangesAsync();
            return NoContent();
        }

        private bool CustomerExists(int id)
        {
            return _context.Customers.Any(e => e.ID == id);
        }

        private async Task<string> GenerateNextCustomerCodeAsync()
        {
            var customerCodes = await _context.Customers
                .AsNoTracking()
                .Where(e => e.CustomerCode != null && e.CustomerCode.StartsWith(CustomerCodePrefix))
                .Select(e => e.CustomerCode!)
                .ToListAsync();

            var maxNumber = 0;

            foreach (var customerCode in customerCodes)
            {
                var numberText = customerCode[CustomerCodePrefix.Length..];

                if (int.TryParse(numberText, out var number) && number > maxNumber)
                {
                    maxNumber = number;
                }
            }

            return $"{CustomerCodePrefix}{maxNumber + 1}";
        }

        private static bool IsUniqueCustomerCodeException(DbUpdateException exception)
        {
            var message = exception.InnerException?.Message ?? exception.Message;

            return message.Contains("IX_Customers_CustomerCode", StringComparison.OrdinalIgnoreCase)
                || message.Contains("Duplicate entry", StringComparison.OrdinalIgnoreCase)
                || message.Contains("UNIQUE", StringComparison.OrdinalIgnoreCase);
        }
    }
}
