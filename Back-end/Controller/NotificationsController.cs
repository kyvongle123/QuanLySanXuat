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
    public class NotificationsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public NotificationsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Notifications/receiver/admin
        // Lấy danh sách thông báo của một người dùng cụ thể
        [HttpGet("receiver/{username}")]
        public async Task<ActionResult<IEnumerable<Notification>>> GetNotifications(string username)
        {
            return await _context.Notifications
                .Where(n => n.Receiver == username)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();
        }

        // GET: api/Notifications/unread-count/admin
        [HttpGet("unread-count/{username}")]
        public async Task<ActionResult<int>> GetUnreadCount(string username)
        {
            return await _context.Notifications
                .CountAsync(n => n.Receiver == username && !n.IsRead);
        }

        // POST: api/Notifications
        // Tạo thông báo mới
        [HttpPost]
        public async Task<ActionResult<Notification>> PostNotification(Notification notification)
        {
            notification.CreatedAt = DateTime.Now;
            notification.IsRead = false;

            _context.Notifications.Add(notification);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetNotifications), new { username = notification.Receiver }, notification);
        }

        // PUT: api/Notifications/mark-read/5
        // Đánh dấu một thông báo là đã đọc
        [HttpPut("mark-read/{id}")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var notification = await _context.Notifications.FindAsync(id);
            if (notification == null)
            {
                return NotFound();
            }

            notification.IsRead = true;
            notification.ReadAt = DateTime.Now;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // PUT: api/Notifications/mark-all-read/admin
        [HttpPut("mark-all-read/{username}")]
        public async Task<IActionResult> MarkAllAsRead(string username)
        {
            var unreadNotifications = await _context.Notifications
                .Where(n => n.Receiver == username && !n.IsRead)
                .ToListAsync();

            foreach (var n in unreadNotifications)
            {
                n.IsRead = true;
                n.ReadAt = DateTime.Now;
            }

            await _context.SaveChangesAsync();
            return NoContent();
        }

        // DELETE: api/Notifications/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            var notification = await _context.Notifications.FindAsync(id);
            if (notification == null) return NotFound();

            _context.Notifications.Remove(notification);
            await _context.SaveChangesAsync();
            return NoContent();
        }
    }
}