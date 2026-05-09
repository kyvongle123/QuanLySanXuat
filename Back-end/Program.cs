using Microsoft.EntityFrameworkCore;
using MyProject.Backend.Data;
using MyProject.Service;

var builder = WebApplication.CreateBuilder(args);

// 1. Cấu hình SQL Server
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
// Dòng này sẽ in ra cửa sổ Console (màu đen) khi bạn chạy ứng dụng
Console.WriteLine("=================================================");
Console.WriteLine($"[DEBUG] Connection String: {connectionString}");

// Kiểm tra xem giá trị này đến từ đâu (File nào, hay Biến môi trường)
foreach (var source in ((IConfigurationRoot)builder.Configuration).Providers)
{
    if (source.TryGet("ConnectionStrings:DefaultConnection", out var value))
    {
        Console.WriteLine($"[SOURCE FOUND] Giá trị '{value}' được nạp từ: {source}");
    }
}
Console.WriteLine("=================================================");

builder.Services.AddDbContext<AppDbContext>(options =>
    // TiDB tương thích tốt với MySQL 8.0.11
    options.UseMySql(connectionString, new MySqlServerVersion(new Version(8, 0, 11))));

// 2. Cấu hình CORS (Cho phép Front-end gọi API)
builder.Services.AddCors(options => {
    options.AddPolicy("AllowAll", policy => policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var port = Environment.GetEnvironmentVariable("PORT") ?? "10000";
builder.WebHost.UseUrls($"http://*:{port}");

// 3. Đăng ký ProductionPlanInfoService vào DI container
builder.Services.AddScoped<ProductionPlanInfoService>();
builder.Services.AddScoped<MaterialReceiptInfoService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseRouting(); // Thêm nếu cần thiết để xác định route trước khi áp dụng CORS
app.UseCors("AllowAll");
app.UseStaticFiles(); // Cho phép truy cập các file trong wwwroot qua URL
app.UseAuthorization();
app.MapControllers();

// Khởi tạo Database
if (app.Environment.IsDevelopment())
{
    using (var scope = app.Services.CreateScope()) 
    {
        var context = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        try
        {
            context.Database.Migrate();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Lỗi khởi tạo Database: {ex.Message}");
        }
    }
}

app.Run();