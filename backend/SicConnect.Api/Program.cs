using System.Text.Json.Serialization;
using SicConnect.Api.Extensions;
using SicConnect.Api.Infrastructure.Data;
using SicConnect.Api.Middleware;

const string CorsPolicy = "SicConnectSpa";

var builder = WebApplication.CreateBuilder(args);

// ---------- Services (composition root) ----------
builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        // Serialize/accept enums as their string names (e.g. "Admin", "Job", "Pending")
        // so the API contract matches the React client, which uses string enum values.
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddPersistence(builder.Configuration);
builder.Services.AddApplicationServices();
builder.Services.AddValidation();
builder.Services.AddJwtAuthentication(builder.Configuration);
builder.Services.AddCorsPolicy(builder.Configuration, CorsPolicy);
builder.Services.AddSwaggerDocs();

var app = builder.Build();

// ---------- Middleware pipeline ----------
app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(o =>
    {
        o.SwaggerEndpoint("/swagger/v1/swagger.json", "SIC Connect API v1");
        o.DocumentTitle = "SIC Connect API";
    });
}

// In Development we do NOT force an HTTPS redirect: the SPA calls the API cross-origin, and
// a 307 http->https redirect makes the browser drop the Authorization header, which would
// turn every authenticated request into a 401. In production, HTTPS is terminated/enforced
// at the host, so we keep the redirect there.
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseCors(CorsPolicy);
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// ---------- Migrate + seed on startup ----------
// Enabled in appsettings.Development.json only, so demo accounts are never created elsewhere.
if (builder.Configuration.GetValue("Seed:Enabled", false))
{
    await DbSeeder.MigrateAndSeedAsync(app.Services);
}

app.Run();
