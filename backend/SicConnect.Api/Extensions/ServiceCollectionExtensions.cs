using System.Text;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using SicConnect.Api.Application.Common;
using SicConnect.Api.Application.Interfaces;
using SicConnect.Api.Application.Services;
using SicConnect.Api.Infrastructure.Data;
using SicConnect.Api.Infrastructure.Security;

namespace SicConnect.Api.Extensions;

/// <summary>
/// Composition helpers. Each method wires one concern so <c>Program.cs</c> reads as a
/// short, declarative composition root.
/// </summary>
public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddPersistence(this IServiceCollection services, IConfiguration config)
    {
        var connectionString = config.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' is not configured.");

        services.AddDbContext<AppDbContext>(options => options.UseSqlServer(connectionString));
        return services;
    }

    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddHttpContextAccessor();
        services.AddScoped<ICurrentUser, CurrentUser>();

        services.AddSingleton<IPasswordHasher, PasswordHasher>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IProfileService, ProfileService>();
        services.AddScoped<ICvService, CvService>();
        services.AddScoped<IDirectoryService, DirectoryService>();
        services.AddScoped<ILeaderboardService, LeaderboardService>();
        services.AddScoped<IMentorService, MentorService>();
        services.AddScoped<IContactService, ContactService>();
        services.AddScoped<IOpportunityService, OpportunityService>();
        services.AddScoped<IEventService, EventService>();
        services.AddScoped<IProjectService, ProjectService>();
        services.AddScoped<IAnnouncementService, AnnouncementService>();
        services.AddScoped<IAdminService, AdminService>();
        services.AddScoped<IAnalyticsService, AnalyticsService>();
        services.AddScoped<INotificationService, NotificationService>();
        services.AddScoped<INetworkingService, NetworkingService>();
        services.AddScoped<IApplicationService, ApplicationService>();
        services.AddScoped<IRecommendationService, RecommendationService>();
        services.AddScoped<IMessageService, MessageService>();

        return services;
    }

    public static IServiceCollection AddValidation(this IServiceCollection services)
    {
        services.AddFluentValidationAutoValidation();
        services.AddValidatorsFromAssembly(typeof(Program).Assembly);
        return services;
    }

    public static IServiceCollection AddJwtAuthentication(this IServiceCollection services, IConfiguration config)
    {
        var settings = new JwtSettings();
        config.GetSection(JwtSettings.SectionName).Bind(settings);
        services.Configure<JwtSettings>(config.GetSection(JwtSettings.SectionName));

        if (string.IsNullOrWhiteSpace(settings.Secret) || settings.Secret.Length < 32)
            throw new InvalidOperationException(
                "Jwt:Secret must be configured with at least 32 characters. Set it in appsettings or user-secrets.");

        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = settings.Issuer,
                ValidAudience = settings.Audience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(settings.Secret)),
                ClockSkew = TimeSpan.FromMinutes(1)
            };

            // Surface the exact reason a token was rejected (e.g. IDX10223 expired,
            // IDX10503 signature invalid) in the API console — invaluable for diagnosing 401s.
            options.Events = new JwtBearerEvents
            {
                OnAuthenticationFailed = context =>
                {
                    var logger = context.HttpContext.RequestServices
                        .GetRequiredService<ILoggerFactory>()
                        .CreateLogger("JwtBearer");
                    logger.LogWarning("JWT authentication failed: {Message}", context.Exception.Message);
                    return Task.CompletedTask;
                }
            };
        });

        services.AddAuthorization();
        return services;
    }

    public static IServiceCollection AddCorsPolicy(this IServiceCollection services, IConfiguration config, string policyName)
    {
        var origins = config.GetSection("Cors:AllowedOrigins").Get<string[]>()
            ?? new[] { "http://localhost:5173" };

        services.AddCors(options =>
        {
            options.AddPolicy(policyName, policy => policy
                .WithOrigins(origins)
                .AllowAnyHeader()
                .AllowAnyMethod());
        });

        return services;
    }

    public static IServiceCollection AddSwaggerDocs(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "SIC Connect API",
                Version = "v1",
                Description = "Samsung Innovation Campus Alumni Digital Ecosystem — REST API."
            });

            var scheme = new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                In = ParameterLocation.Header,
                Description = "Enter the JWT returned by /api/auth/login (no 'Bearer ' prefix needed).",
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            };

            options.AddSecurityDefinition("Bearer", scheme);
            options.AddSecurityRequirement(new OpenApiSecurityRequirement { [scheme] = Array.Empty<string>() });
        });

        return services;
    }
}
