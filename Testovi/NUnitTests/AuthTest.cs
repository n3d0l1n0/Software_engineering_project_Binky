using NUnit.Framework;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using MyBackend.Controllers;
using MyBackend.Models;
using MyBackend.DTOs;
using MyBackend.Services;

namespace backTest
{
    public class AuthTest
    {
        private BinkyContext _context = null!;
        private AuthController _controller = null!;

        private class FakeTokenService : TokenService
        {
            public FakeTokenService() : base(null!) { }

            public string CreateToken(List<Claim> claims)
            {
                return "fake-jwt-token";
            }
        }

        private class FakeEnc : IEncryptionService
        {
            public FakeEnc() {}
            public string Encrypt(string plainText)
            {
                return plainText;
            }

            public string Decrypt(string cipherText)
            {
                return cipherText;
            }
        }


        [SetUp]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<BinkyContext>()
                .UseNpgsql("Host=localhost;Database=Binky;Username=postgres;Password=postgres")
                .Options;

            _context = new BinkyContext(options);

            var tokenService = new FakeTokenService();
            _controller = new AuthController(_context, tokenService, new FakeEnc());
        }

        [TearDown]
        public void TearDown()
        {
            _context.Dispose();
        }

        // SUCCESS LOGIN
        [Test]
        public async Task LoginLekar_OK()
        {

            var dto = new LoginDto
            {
                Email = "milan.petrovic@bolnica.rs",
                Lozinka = "lozinka123"
            };

            var result = await _controller.LoginLekar(dto);

            Assert.That(result, Is.InstanceOf<OkObjectResult>());

            var r = (OkObjectResult)result;
            Console.WriteLine(r.Value.ToString());
            Assert.That(r.StatusCode, Is.EqualTo(200));

            var response = r.Value;
            Assert.That(response, Is.Not.Null);
        }

        // EMAIL DOES NOT EXIST
        [Test]
        public async Task LoginLekar_BadMail()
        {
            var dto = new LoginDto
            {
                Email = "nepostoji@test.com",
                Lozinka = "Test123!"
            };

            var result = await _controller.LoginLekar(dto);

            Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());

            var unauthorized = (UnauthorizedObjectResult)result;
            Assert.That(unauthorized.StatusCode, Is.EqualTo(401));
            Assert.That(unauthorized.Value, Is.EqualTo("Pogrešan email ili lozinka."));
        }

        // WRONG PASSWORD
        [Test]
        public async Task LoginLekar_BadPass()
        {

            var dto = new LoginDto
            {
                Email = "milan.petrovic@bolnica.rs",
                Lozinka = "Pogresna123!"
            };

            var result = await _controller.LoginLekar(dto);

            Assert.That(result, Is.InstanceOf<UnauthorizedObjectResult>());

            var unauthorized = (UnauthorizedObjectResult)result;
            Assert.That(unauthorized.StatusCode, Is.EqualTo(401));
            Assert.That(unauthorized.Value, Is.EqualTo("Pogrešna email ili lozinka."));
        }
    }
}
