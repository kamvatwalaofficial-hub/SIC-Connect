using SicConnect.Api.Domain.Entities;

namespace SicConnect.Api.Application.Interfaces;

/// <summary>Issues signed JWT access tokens for authenticated users.</summary>
public interface IJwtTokenService
{
    /// <summary>Creates a signed JWT and returns the token string and its UTC expiry.</summary>
    (string token, DateTime expiresAt) CreateToken(User user);
}
