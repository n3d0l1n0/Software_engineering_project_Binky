using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using MyBackend.Controllers;
using MyBackend.Models;

namespace backTest
{
    [TestFixture]
    public class RezultatControllerTests
    {
        private BinkyContext _context;
        private RezultatController _controller;
        private IDbContextTransaction _transaction;

        [SetUp]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<BinkyContext>()
                .UseNpgsql("Host=localhost;Database=Binky;Username=postgres;Password=postgres")
                .Options;

            _context = new BinkyContext(options);
            _transaction = _context.Database.BeginTransaction();
            _controller = new RezultatController(_context);
        }

        [TearDown]
        public void TearDown()
        {
            _transaction.Rollback();
            _transaction.Dispose();
            _context.Dispose();
        }

        // GetRezultat
        [Test]
        public async Task GetRezultat_OkId()
        {
            var result = await _controller.GetRezultat(7);

            Assert.That(result.Value, Is.Not.Null);
            Assert.That(result.Value.Id, Is.EqualTo(7));
            Assert.That(result.Value.Pregled, Is.Not.Null);
            Assert.That(result.Value.Pregled.Leci, Is.Not.Null);
        }

        [Test]
        public async Task GetRezultat_BadId()
        {
            var result = await _controller.GetRezultat(999);

            Assert.That(result.Result, Is.TypeOf<NotFoundResult>());
        }

        [Test]
        public async Task GetRezultat_ITip()
        {
            var id = _context.Rezultati.First().Id;
            var result = await _controller.GetRezultat(id);

            Assert.That(result.Value.Pregled.TipPregleda, Is.Not.Null);
        }

        // CreateRezultat
        [Test]
        public async Task CreateRezultat_Ok()
        {
            var pregled = _context.Pregledi.First();
            var rezultat = new Rezultat
            {
                IdPregleda = pregled.Id,
                Sadrzaj = "Test vrednost",
                Datum = DateTime.UtcNow
            };

            var result = await _controller.CreateRezultat(rezultat);

            Assert.That(result.Result, Is.TypeOf<CreatedAtActionResult>());
            var created = (result.Result as CreatedAtActionResult)!.Value as Rezultat;
            Assert.That(created, Is.Not.Null);
            Assert.That(created.Sadrzaj, Is.EqualTo("Test vrednost"));
        }

        [Test]
        public async Task CreateRezultat_OkMultiple()
        {
            var pregled = _context.Pregledi.First();
            var rezultat1 = new Rezultat { IdPregleda = pregled.Id, Sadrzaj = "R1", Datum = DateTime.UtcNow };
            var rezultat2 = new Rezultat { IdPregleda = pregled.Id, Sadrzaj = "R2", Datum = DateTime.UtcNow };

            var res1 = await _controller.CreateRezultat(rezultat1);
            var res2 = await _controller.CreateRezultat(rezultat2);

            Assert.That((res1.Result as CreatedAtActionResult)!.Value, Is.Not.Null);
            Assert.That((res2.Result as CreatedAtActionResult)!.Value, Is.Not.Null);
        }

        [Test]
        public async Task CreateRezultat_OkDatum()
        {
            var pregled = _context.Pregledi.First();
            var datum = DateTime.SpecifyKind(DateTime.UtcNow, DateTimeKind.Utc);
            var rezultat = new Rezultat { IdPregleda = pregled.Id, Sadrzaj = "Datum test", Datum = datum };

            var result = await _controller.CreateRezultat(rezultat);

            var created = (result.Result as CreatedAtActionResult)!.Value as Rezultat;
            Assert.That(created.Datum.Kind, Is.EqualTo(DateTimeKind.Utc));
        }

        // DeleteRezultat
        [Test]
        public async Task DeleteRezultat_OkId()
        {
            var result = await _controller.DeleteRezultat(9);

            var deleted = await _context.Rezultati.FindAsync(9);
            Assert.That(result, Is.TypeOf<NoContentResult>());
            Assert.That(deleted, Is.Null);
        }

        [Test]
        public async Task DeleteRezultat_BadId()
        {
            var result = await _controller.DeleteRezultat(999);

            Assert.That(result, Is.TypeOf<NotFoundResult>());
        }

        [Test]
        public async Task DeleteRezultat_OstaliOstaju()
        {

            await _controller.DeleteRezultat(5);

            var remaining = await _context.Rezultati.FindAsync(6);
            Assert.That(remaining, Is.Not.Null);
        }

        // GetRezultatiZaPregled
        [Test]
        public async Task GetRezultatiZaPregled_OkId()
        {
            var idPregleda = _context.Rezultati.First().IdPregleda;
            var result = await _controller.GetRezultatiZaPregled(idPregleda);

            var ok = result.Result as OkObjectResult;
            var lista = ok!.Value as List<Rezultat>;
            Assert.That(lista, Is.Not.Empty);
            Assert.That(lista.All(r => r.IdPregleda == idPregleda));
        }

        [Test]
        public async Task GetRezultatiZaPregled_BadId()
        {
            var result = await _controller.GetRezultatiZaPregled(999);

            var ok = result.Result as OkObjectResult;
            var lista = ok!.Value as List<Rezultat>;
            Assert.That(lista, Is.Empty);
        }

        [Test]
        public async Task GetRezultatiZaPregled_DateUtc()
        {
            var idPregleda = _context.Rezultati.First().IdPregleda;
            var result = await _controller.GetRezultatiZaPregled(idPregleda);

            var ok = result.Result as OkObjectResult;
            var lista = ok!.Value as List<Rezultat>;
            Assert.That(lista.All(r => r.Datum.Kind == DateTimeKind.Utc));
        }

        // GetRezultatiZaPorodilju
        [Test]
        public async Task GetRezultatiZaPorodilju_OkId()
        {
            var idPorodilje = _context.Lecenje.First().IdPorodilje;
            var result = await _controller.GetRezultatiZaPorodilju(idPorodilje);

            var ok = result.Result as OkObjectResult;
            var lista = ok!.Value as List<Rezultat>;
            Assert.That(lista, Is.Not.Empty);
            Assert.That(lista.All(r => r.Pregled.Leci.IdPorodilje == idPorodilje));
        }

        [Test]
        public async Task GetRezultatiZaPorodilju_BadId()
        {
            var result = await _controller.GetRezultatiZaPorodilju(999);

            var ok = result.Result as OkObjectResult;
            var lista = ok!.Value as List<Rezultat>;
            Assert.That(lista, Is.Empty);
        }

        [Test]
        public async Task GetRezultatiZaPorodilju_ITip()
        {
            var idPorodilje = _context.Lecenje.First().IdPorodilje;
            var result = await _controller.GetRezultatiZaPorodilju(idPorodilje);

            var ok = result.Result as OkObjectResult;
            var lista = ok!.Value as List<Rezultat>;
            Assert.That(lista.All(r => r.Pregled.TipPregleda != null));
        }
    }
}
