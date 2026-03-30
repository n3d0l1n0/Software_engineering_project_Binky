using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using MyBackend.Controllers;
using MyBackend.DTOs;
using MyBackend.Models;
using NUnit.Framework;

namespace backTest
{
    public class LekarTest
    {
        private BinkyContext _context = null!;
        private LekarController _controller = null!;
        private IDbContextTransaction _transaction;

        [SetUp]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<BinkyContext>()
                .UseNpgsql("Host=localhost;Database=Binky;Username=postgres;Password=postgres")
                .Options;

            _context = new BinkyContext(options);
            _controller = new LekarController(_context);
            _transaction = _context.Database.BeginTransaction();
        }

        [TearDown]
        public void TearDown()
        {
            _transaction.Rollback();
            _transaction.Dispose();
            _context.Dispose();
        }

        // GetLekari

        [Test]
        public async Task GetLekari_Ok()
        {
            var result = await _controller.GetLekari();

            Assert.That(result.Value, Is.Not.Null);
            Assert.That(result.Value.Count(), Is.EqualTo(3));
        }

        [Test]
        public async Task GetLekari_Prazno()
        {
            _context.Lekari.RemoveRange(_context.Lekari);
            await _context.SaveChangesAsync();

            var result = await _controller.GetLekari();

            Assert.That(result.Value, Is.Empty);
        }

        [Test]
        public async Task GetLekari_TypeCheck()
        {
            var result = await _controller.GetLekari();
            Assert.That(result.Value, Is.InstanceOf<IEnumerable<Lekar>>());
        }

        // GetLekar

        [Test]
        public async Task GetLekar_OK()
        {
            var lekar = await _context.Lekari.FirstAsync();

            var result = await _controller.GetLekar(lekar.Id);

            Assert.That(result.Value!.Id, Is.EqualTo(lekar.Id));
        }

        [Test]
        public async Task GetLekar_NotFound()
        {
            var result = await _controller.GetLekar(-999);

            Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
        }

        [Test]
        public async Task GetLekar_ValidType()
        {
            var lekar = await _context.Lekari.FirstAsync();
            var result = await _controller.GetLekar(lekar.Id);

            Assert.That(result.Value, Is.TypeOf<Lekar>());
        }

        // CreateLekar

        [Test]
        public async Task CreateLekar_OK()
        {
            var lekar = new Lekar { ImeIPrezime = "Test", Email = "t@t.com", Lozinka = "pass" };

            var result = await _controller.CreateLekar(lekar);

            Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
        }

        [Test]
        public async Task CreateLekar_SavedInDb()
        {
            var lekar = new Lekar { ImeIPrezime = "Lekar", Email = "m@m.com", Lozinka = "pass" };

            await _controller.CreateLekar(lekar);

            Assert.That(_context.Lekari.Any(x => x.ImeIPrezime == "Lekar"));
        }

        [Test]
        public async Task CreateLekar_ReturnedObject()
        {
            var lekar = new Lekar { ImeIPrezime = "Test", Email="dhwud@c.c", Lozinka = "pass" };

            var result = await _controller.CreateLekar(lekar);
            var created = result.Result as CreatedAtActionResult;

            Assert.That(created!.Value, Is.InstanceOf<Lekar>());
        }

        // DeleteLekar

        [Test]
        public async Task DeleteLekar_OK()
        {
            var lekar = await _context.Lekari.FirstAsync();

            var result = await _controller.DeleteLekar(lekar.Id);

            Assert.That(result, Is.InstanceOf<NoContentResult>());
        }

        [Test]
        public async Task DeleteLekar_NotFound()
        {
            var result = await _controller.DeleteLekar(-500);

            Assert.That(result, Is.InstanceOf<NotFoundResult>());
        }

        [Test]
        public async Task DeleteLekar_RemovedFromDb()
        {
            var lekar = await _context.Lekari.FirstAsync();

            await _controller.DeleteLekar(lekar.Id);

            Assert.That(!_context.Lekari.Any(x => x.Id == lekar.Id));
        }

        // PromeniLozinku

        [Test]
        public async Task PromeniLozinku_OK()
        {
            var dto = new PromenaLozinkeDto
            {
                TrenutnaLozinka = "lozinka123",
                NovaLozinka = "nova123"
            };

            var result = await _controller.PromeniLozinku(4, dto);
            var bad = result as BadRequestObjectResult;
            Console.WriteLine(bad?.Value);
            Assert.That(result, Is.InstanceOf<NoContentResult>());
        }

        [Test]
        public async Task PromeniLozinku_BadPass()
        {
            var lekar = await _context.Lekari.FirstAsync();

            var dto = new PromenaLozinkeDto
            {
                TrenutnaLozinka = "pogresna",
                NovaLozinka = "nova123"
            };

            var result = await _controller.PromeniLozinku(lekar.Id, dto);

            Assert.That(result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task PromeniLozinku_BadId()
        {
            var dto = new PromenaLozinkeDto
            {
                TrenutnaLozinka = "test",
                NovaLozinka = "nova"
            };

            var result = await _controller.PromeniLozinku(999, dto);

            Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
        }
    }
}
