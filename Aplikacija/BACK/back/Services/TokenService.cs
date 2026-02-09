using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;

namespace MyBackend.Services;

public class TokenService
{
    private readonly IConfiguration _config;
    public TokenService(IConfiguration config)
    {
        _config = config;
    }
    public string CreateToken(IEnumerable<Claim> claims)
    {
        var expireStr = _config["JwtSettings:ExpireMinutes"];
    Console.WriteLine($"ExpireMinutes iz konfiguracije: {expireStr}");

    var securityKey = _config["JwtSettings:SecurityKey"];
    Console.WriteLine($"SecurityKey: {(securityKey != null ? "postoji" : "NEDOSTAJE")}");
        var key = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(securityKey!));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: _config["JwtSettings:Issuer"],
            audience: _config["JwtSettings:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(Convert.ToDouble(_config["JwtSettings:ExpireMinutes"])),
            signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}