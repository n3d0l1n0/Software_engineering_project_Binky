using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using MyBackend.Controllers;
using MyBackend.DTOs;
using MyBackend.Models;
using NUnit.Framework;

namespace backTest
{
    public class PregledTest
    {
        private BinkyContext _context = null!;
        private PregledController _controller = null!;
        private IDbContextTransaction _transaction;

        [SetUp]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<BinkyContext>()
                .UseNpgsql("Host=localhost;Database=Binky;Username=postgres;Password=postgres")
                .Options;

            _context = new BinkyContext(options);
            _controller = new PregledController(_context);
            _transaction = _context.Database.BeginTransaction();
        }

        [TearDown]
        public void TearDown()
        {
            _transaction.Rollback();
            _transaction.Dispose();
            _context.Dispose();
        }

        // GetSlobodniTermini

        [Test]
        public async Task GetSlobodniTermini_OK()
        {
            var result = await _controller.GetSlobodniTermini(4, DateTime.UtcNow, 1);
            Assert.That(result.Value, Is.Not.Null);
        }

        [Test]
        public async Task GetSlobodniTermini_BadId()
        {
            var result = await _controller.GetSlobodniTermini(999, DateTime.UtcNow, 1);
            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task GetSlobodniTermini_BadTip()
        {
            var result = await _controller.GetSlobodniTermini(1, DateTime.UtcNow, -1);
            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        }

        // ZakaziPregled

        [Test]
        public async Task ZakaziPregled_OK()
        {
            var dto = new ZakaziPregledDto
            {
                IdPorodilje = 4,
                IdTipaPregleda = 1,
                Termin = DateTime.UtcNow.AddDays(30)
            };

            var result = await _controller.ZakaziPregled(dto);

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task ZakaziPregled_BadId()
        {
            var dto = new ZakaziPregledDto
            {
                IdPorodilje = 999,
                IdTipaPregleda = 1,
                Termin = DateTime.UtcNow
            };

            var result = await _controller.ZakaziPregled(dto);

            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        }

        [Test]
        public async Task ZakaziPregled_BadTip()
        {
            var dto = new ZakaziPregledDto
            {
                IdPorodilje = 1,
                IdTipaPregleda = 999,
                Termin = DateTime.UtcNow
            };

            var result = await _controller.ZakaziPregled(dto);

            Assert.That(result.Result, Is.InstanceOf<BadRequestObjectResult>());
        }

        // GetZahteviZaPregled

        [Test]
        public async Task GetZahtevi_OK()
        {
            var result = await _controller.GetZahteviZaPregled(4);
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task GetZahtevi_Type()
        {
            var result = await _controller.GetZahteviZaPregled(1);
            var ok = result.Result as OkObjectResult;
            Assert.That(ok!.Value, Is.Not.Null);
        }

        [Test]
        public async Task GetZahtevi_BadId()
        {
            var result = await _controller.GetZahteviZaPregled(999);
            var ok = result.Result as OkObjectResult;
            Assert.That(ok!.Value, Is.Empty);
        }

        // PrihvatiPregled

        [Test]
        public async Task PrihvatiPregled_OK()
        {
            var result = await _controller.PrihvatiPregled(17);

            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task PrihvatiPregled_BadId()
        {
            var result = await _controller.PrihvatiPregled(999);
            Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task PrihvatiPregled_StatusChanged()
        {
            await _controller.PrihvatiPregled(16);

            var updated = await _context.Pregledi.FindAsync(16);
            Assert.That(updated!.JePotvrdjen, Is.True);
        }

        // OdbijPregled

        [Test]
        public async Task OdbijPregled_OK()
        {
            var result = await _controller.OdbijPregled(16);
            Assert.That(result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task OdbijPregled_BadId()
        {
            var result = await _controller.OdbijPregled(999);
            Assert.That(result, Is.InstanceOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task OdbijPregled_odbijen()
        {
            await _controller.OdbijPregled(16);

            Assert.That(!_context.Pregledi.Any(x => x.Id == 16));
        }

        // GetRasporedZaDan

        [Test]
        public async Task GetRaspored_OK()
        {
            var result = await _controller.GetRasporedZaDan(4, DateTime.UtcNow);
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task GetRaspored_BadId()
        {
            var result = await _controller.GetRasporedZaDan(999, DateTime.UtcNow);
            var ok = result.Result as OkObjectResult;
            Assert.That(ok!.Value, Is.Empty);
        }

        [Test]
        public async Task GetRaspored_Type()
        {
            var result = await _controller.GetRasporedZaDan(1, DateTime.UtcNow);
            Assert.That(result, Is.Not.Null);
        }

        // GetDatumiPregleda

        [Test]
        public async Task GetDatumi_OK()
        {
            var result = await _controller.GetDatumiPregleda(4);
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task GetDatumi_BadId()
        {
            var result = await _controller.GetDatumiPregleda(999);
            var ok = result.Result as OkObjectResult;
            Assert.That(ok!.Value, Is.Empty);
        }

        [Test]
        public async Task GetDatumi_Sadrzaj()
        {
            var result = await _controller.GetDatumiPregleda(4);
            Assert.That(result, Is.Not.Null);
        }

        // GetDozvoljeniPregledi

        [Test]
        public async Task GetDozvoljeniPregledi_OK()
        {
            var result = await _controller.GetDozvoljeniPregledi(4);
            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());
        }

        [Test]
        public async Task GetDozvoljeniPregledi_BadId()
        {
            var result = await _controller.GetDozvoljeniPregledi(999);
            Assert.That(result.Result, Is.InstanceOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task GetDozvoljeniPregledi_Sadrzaj()
        {
            var result = await _controller.GetDozvoljeniPregledi(4);
            Assert.That(result, Is.Not.Null);
        }

        // GetPregled

        [Test]
        public async Task GetPregled_OK()
        {
            var result = await _controller.GetPregled(15);

            Assert.That(result.Value, Is.Not.Null);
        }

        [Test]
        public async Task GetPregled_BadId()
        {
            var result = await _controller.GetPregled(999);
            Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
        }

        [Test]
        public async Task GetPregled_Type()
        {
            var result = await _controller.GetPregled(15);

            Assert.That(result.Value, Is.TypeOf<Pregled>());
        }

        // Createpregled

        [Test]
        public async Task CreatePregled_OK()
        {
            var pregled = new Pregled { IdLeci = 10, IdTipaPregleda = 2, Termin = DateTime.UtcNow.AddDays(15) };

            var result = await _controller.CreatePregled(pregled);

            Assert.That(result.Result, Is.InstanceOf<CreatedAtActionResult>());
        }

        [Test]
        public async Task CreatePregled_Saved()
        {
            var termin = DateTime.UtcNow.AddDays(16);
            var pregled = new Pregled { IdLeci = 10, IdTipaPregleda = 3, Termin = termin };

            await _controller.CreatePregled(pregled);
            Assert.That(_context.Pregledi.Any(p =>
                p.IdLeci == 10 &&
                p.IdTipaPregleda == 3 &&
                p.Termin == termin));
        }

        [Test]
        public async Task CreatePregled_Type()
        {
            var pregled = new Pregled { IdLeci = 10, IdTipaPregleda = 1, Termin = DateTime.UtcNow.AddDays(12) };

            var result = await _controller.CreatePregled(pregled);
            var created = result.Result as CreatedAtActionResult;

            Assert.That(created!.Value, Is.InstanceOf<Pregled>());
        }

        // UpdatePregled

        [Test]
        public async Task UpdatePregled_OK()
        {
            var pregled = await _context.Pregledi.FirstAsync();

            var result = await _controller.UpdatePregled(pregled.Id, pregled);

            Assert.That(result, Is.InstanceOf<NoContentResult>());
        }

        [Test]
        public async Task UpdatePregled_BadId()
        {
            var pregled = await _context.Pregledi.FirstAsync();

            var result = await _controller.UpdatePregled(999, pregled);

            Assert.That(result, Is.InstanceOf<BadRequestResult>());
        }

        [Test]
        public async Task UpdatePregled_MissMatch()
        {
            var pregled = new Pregled { Id = 50 };

            var result = await _controller.UpdatePregled(999, pregled);

            Assert.That(result, Is.InstanceOf<BadRequestResult>());
        }


        // DeletePregled

        [Test]
        public async Task DeletePregled_OK()
        {
            var pregled = await _context.Pregledi.FirstAsync();

            var result = await _controller.DeletePregled(pregled.Id);

            Assert.That(result, Is.InstanceOf<NoContentResult>());
        }

        [Test]
        public async Task DeletePregled_BadId()
        {
            var result = await _controller.DeletePregled(999);

            Assert.That(result, Is.InstanceOf<NotFoundResult>());
        }

        [Test]
        public async Task DeletePregled_Removed()
        {
            var pregled = await _context.Pregledi.FirstAsync();

            await _controller.DeletePregled(pregled.Id);

            Assert.That(!_context.Pregledi.Any(x => x.Id == pregled.Id));
        }
    }
}
