namespace SicConnect.Api.Application.Interfaces;

/// <summary>Hashes and verifies passwords. Backed by BCrypt in the Infrastructure layer.</summary>
public interface IPasswordHasher
{
    string Hash(string password);
    bool Verify(string password, string hash);
}
