using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using MyBackend.Controllers;
using MyBackend.Models;
using System.ComponentModel;

namespace backTest
{
    [TestFixture]
    public class LeciTests
    {
        private BinkyContext _context;
        private LeciController _controller;
        private IDbContextTransaction _transaction;

        [SetUp]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<BinkyContext>()
                .UseNpgsql("Host=localhost;Database=Binky;Username=postgres;Password=postgres")
                .Options;

            _context = new BinkyContext(options);

            _transaction = _context.Database.BeginTransaction();
            _controller = new LeciController(_context);
        }

        [TearDown]
        public void TearDown()
        {
            _transaction.Rollback();
            _transaction.Dispose();
            _context.Dispose();
        }

        // GetLecenja

        [Test]
        public async Task GetLecenja_SamoAktivna()
        {
            var result = await _controller.GetLecenja();

            Assert.That(result, Is.InstanceOf<ActionResult<IEnumerable<Leci>>>());
            Assert.That(result.Value.Count(), Is.EqualTo(1));
            Assert.That(result.Value.First().Aktivno, Is.True);
        }

        [Test]
        public async Task GetLecenja_NemaAktivnih()
        {
            foreach (var l in _context.Lecenje) l.Aktivno = false;
            await _context.SaveChangesAsync();

            var result = await _controller.GetLecenja();

            Assert.That(result.Value, Is.Empty);
        }

        [Test]
        public async Task GetLecenja_ILekarIPorodilja()
        {
            var result = await _controller.GetLecenja();
            var lecenje = result.Value.First();

            Assert.That(lecenje.Lekar, Is.Not.Null);
            Assert.That(lecenje.Porodilja, Is.Not.Null);
        }

        // GetLecenje by Id

        [Test]
        public async Task GetLecenje_OkId()
        {
            var result = await _controller.GetLecenje(10);

            Assert.That(result, Is.InstanceOf<ActionResult<Leci>>());
            Assert.That(result.Value.Id, Is.EqualTo(10));
        }

        [Test]
        public async Task GetLecenje_BadId()
        {
            var result = await _controller.GetLecenje(999);

            Assert.That(result.Result, Is.TypeOf<NotFoundResult>());
        }

        [Test]
        public async Task GetLecenje_ILekarIPorodilja()
        {
            var result = await _controller.GetLecenje(10);

            Assert.That(result.Value.Lekar, Is.Not.Null);
            Assert.That(result.Value.Porodilja, Is.Not.Null);
        }

        // GetLeciPorodilju

        [Test]
        public async Task GetLeciPorodilju_Aktivno()
        {

            var result = await _controller.GetLeciPorodilju(4);

            Assert.That(result.Result, Is.Null);
            Assert.That(result.Value, Is.Not.Null);
            Assert.That(result.Value!.IdPorodilje, Is.EqualTo(4));
            Assert.That(result.Value.Aktivno, Is.True);
        }

        [Test]
        public async Task GetLeciPorodilju_BadId()
        {
            var result = await _controller.GetLeciPorodilju(999);

            Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
        }

        [Test]
        public async Task GetLeciPorodilju_NemaAktivno()
        {
            var result = await _controller.GetLecenjePorodilje(6);

            Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
        }
        
        // GetLecenjePorodilje

        [Test]
        public async Task GetLecenjePorodilje_Aktivno()
        {

            var result = await _controller.GetLecenjePorodilje(4);

            Assert.That(result.Result, Is.Null);
            Assert.That(result.Value, Is.Not.Null);
            Assert.That(result.Value!.IdPorodilje, Is.EqualTo(4));
            Assert.That(result.Value.Lekar, Is.Not.Null);
            Assert.That(result.Value.Porodilja, Is.Not.Null);
        }

        [Test]
        public async Task GetLecenjePorodilje_BadId()
        {
            var result = await _controller.GetLecenjePorodilje(999);

            Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
        }

        [Test]
        public async Task GetLecenjePorodilje_NemaAktivno()
        {
            var result = await _controller.GetLecenjePorodilje(6);

            Assert.That(result.Result, Is.InstanceOf<NotFoundResult>());
        }

        // GetPorodiljeZaLekara

        [Test]
        public async Task GetPorodiljeZaLekara_Ok()
        {
            var result = await _controller.GetPorodiljeZaLekara(4);

            Assert.That(result.Result, Is.InstanceOf<OkObjectResult>());

            var ok = result.Result as OkObjectResult;
            var lista = ok!.Value as List<Leci>;

            Assert.That(lista, Is.Not.Null);
            Assert.That(lista!.Count, Is.EqualTo(1));
            Assert.That(lista.First().Porodilja!.SePorodila, Is.False);
        }

        [Test]
        public async Task GetPorodiljeZaLekara_BadId()
        {
            var result = await _controller.GetPorodiljeZaLekara(999);

            Assert.That(result.Result, Is.InstanceOf<NotFoundObjectResult>());
        }

        [Test]
        public async Task GetPorodiljeZaLekara_NemaAktivnih()
        {

            var result = await _controller.GetPorodiljeZaLekara(5);

            Assert.That(result.Result, Is.InstanceOf<NotFoundObjectResult>());
        }

        // CreateLecenje

        [Test]
        public async Task CreateLecenje_DodajNovoDeaktivirajStaro()
        {
            var lecenje = new Leci { IdLekara = 4, IdPorodilje = 6, Aktivno = true };
            var result = await _controller.CreateLecenje(lecenje);

            var oldLecenje = await _context.Lecenje.FirstAsync(l => l.Id == 9);

            Assert.That(oldLecenje.Aktivno, Is.False);
            Assert.That(result.Result, Is.TypeOf<CreatedAtActionResult>());
        }

        [Test]
        public async Task CreateLecenje_NovaPorodilja()
        {
            var porodilja = new Porodilja { ImeIPrezime = "Maja Marijana" };
            _context.Porodilje.Add(porodilja);
            await _context.SaveChangesAsync();

            var lecenje = new Leci { IdLekara = 4, IdPorodilje = porodilja.Id, Aktivno = true };
            var result = await _controller.CreateLecenje(lecenje);

            Assert.That(result.Result, Is.TypeOf<CreatedAtActionResult>());
        }

        [Test]
        public async Task CreateLecenje_NoviLekar()
        {
            var lekar = new Lekar { ImeIPrezime = "Paja Dragulj" };
            _context.Lekari.Add(lekar);
            await _context.SaveChangesAsync();

            var lecenje = new Leci { IdLekara = lekar.Id, IdPorodilje = 5, Aktivno = true };
            var result = await _controller.CreateLecenje(lecenje);

            Assert.That(result.Result, Is.TypeOf<CreatedAtActionResult>());
        }

        // DeleteLecenje

        [Test]
        public async Task DeleteLecenje_OkId()
        {
            var result = await _controller.DeleteLecenje(4);

            var deleted = await _context.Lecenje.FindAsync(4);
            Assert.That(result, Is.TypeOf<NoContentResult>());
            Assert.That(deleted, Is.Null);
        }

        [Test]
        public async Task DeleteLecenje_BadId()
        {
            var result = await _controller.DeleteLecenje(999);

            Assert.That(result, Is.TypeOf<NotFoundResult>());
        }

        [Test]
        public async Task DeleteLecenje_OstalaOstaju()
        {
            await _controller.DeleteLecenje(7);

            var other = await _context.Lecenje.FindAsync(10);
            Assert.That(other, Is.Not.Null);
        }
    }
}
