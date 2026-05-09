# Stage 1: Build ứng dụng
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /Back-end

# SỬA TẠI ĐÂY: Copy file .sln và .csproj trực tiếp từ thư mục Back-end
COPY Back-end/*.sln .
COPY Back-end/*.csproj .
RUN dotnet restore

# Copy toàn bộ code trong thư mục Back-end và build
COPY Back-end/ .
RUN dotnet publish -c Release -o /out

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /Back-end
COPY --from=build /out .

ENV ASPNETCORE_URLS=http://+:10000
# SỬA TẠI ĐÂY: Đảm bảo tên file .dll chính xác (thường trùng tên file .csproj)
ENTRYPOINT ["dotnet", "MyProject.Backend.dll"]