using System.Text.Json;
using SicConnect.Api.Application.Common;

namespace SicConnect.Api.Middleware;

/// <summary>
/// Global exception handler. Maps <see cref="AppException"/>s to their HTTP status and
/// returns a consistent <c>{ error, details }</c> JSON body; anything else becomes a 500.
/// </summary>
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;
    private readonly IHostEnvironment _env;

    private static readonly JsonSerializerOptions JsonOptions =
        new(JsonSerializerDefaults.Web);

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger,
        IHostEnvironment env)
    {
        _next = next;
        _logger = logger;
        _env = env;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (AppException ex)
        {
            object? details = ex is ValidationAppException v ? v.Errors : null;
            var status = ex is AccountNotApprovedAppException na ? na.Status : null;
            await WriteAsync(context, ex.StatusCode, ex.Message, details, status);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception processing {Method} {Path}",
                context.Request.Method, context.Request.Path);

            var details = _env.IsDevelopment() ? ex.ToString() : null;
            await WriteAsync(context, StatusCodes.Status500InternalServerError,
                "An unexpected error occurred.", details);
        }
    }

    private static Task WriteAsync(HttpContext context, int statusCode, string error, object? details, string? status = null)
    {
        if (context.Response.HasStarted)
            return Task.CompletedTask;

        context.Response.Clear();
        context.Response.StatusCode = statusCode;
        context.Response.ContentType = "application/json";

        var payload = JsonSerializer.Serialize(new { error, details, status }, JsonOptions);
        return context.Response.WriteAsync(payload);
    }
}
