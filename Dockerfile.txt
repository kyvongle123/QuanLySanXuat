# Stage 1: Build ứng dụng
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /Back-end

# Copy file project và restore dependencies
COPY *.sln .
COPY MyProject.Backend/*.csproj ./MyProject.Backend/
RUN dotnet restore

# Copy toàn bộ code và build
COPY . .
WORKDIR /app/MyProject.Backend
RUN dotnet publish -c Release -o /out

# Stage 2: Chạy ứng dụng
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /Back-end
COPY --from=build /out .

# Render yêu cầu ứng dụng lắng nghe trên cổng 10000 hoặc biến môi trường PORT
ENV ASPNETCORE_URLS=http://+:10000

ENTRYPOINT ["dotnet", "MyProject.Backend.dll"]