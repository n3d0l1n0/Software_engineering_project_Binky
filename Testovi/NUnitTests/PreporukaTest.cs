using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using MyBackend.Controllers;
using MyBackend.Models;

namespace backTest
{
    [TestFixture]
    public class PreporukaTest
    {
        private BinkyContext _context;
        private PreporukaController _controller;
        private IDbContextTransaction _transaction;

        [SetUp]
        public void Setup()
        {
            var options = new DbContextOptionsBuilder<BinkyContext>()
                .UseNpgsql("Host=localhost;Database=Binky;Username=postgres;Password=postgres")
                .Options;

            _context = new BinkyContext(options);
            _transaction = _context.Database.BeginTransaction();
            _controller = new PreporukaController(_context);
        }

        [TearDown]
        public void TearDown()
        {
            _transaction.Rollback();
            _transaction.Dispose();
            _context.Dispose();
        }

        // GetPreporuke
        [Test]
        public async Task GetPreporuke_Ok()
        {
            var result = await _controller.GetPreporuke();

            Assert.That(result.Result, Is.Null);
            Assert.That(result.Value, Is.Not.Null);
            Assert.That(result.Value.Count, Is.EqualTo(2));
        }

        [Test]
        public async Task GetPreporuke_NemaTrudnih()
        {
            foreach (var po in _context.Porodilje) po.SePorodila = true;
            await _context.SaveChangesAsync();

            var result = await _controller.GetPreporuke();

            Assert.That(result.Value, Is.Empty);
        }

        [Test]
        public async Task GetPreporuke_OkTrajanje()
        {
            var result = await _controller.GetPreporuke();

            Assert.That(result.Value, Is.Not.Null);

            var preporuke = result.Value
                .Select(o => new Preporuka
                {
                    Id = (int)o.GetType().GetProperty("id")!.GetValue(o)!,
                    Tekst = (string)o.GetType().GetProperty("tekst")!.GetValue(o)!,
                    DatumOd = (DateTime)o.GetType().GetProperty("datumOd")!.GetValue(o)!,
                    DatumDo = (DateTime)o.GetType().GetProperty("datumDo")!.GetValue(o)!,
                }).ToList();

            foreach (var p in preporuke)
            {
                Assert.That(p.DatumOd, Is.LessThan(p.DatumDo));
            }
        }


        // GetPreporuka
        [Test]
        public async Task GetPreporuka_OkId()
        {
            var result = await _controller.GetPreporuka(8);

            Assert.That(result.Value, Is.Not.Null);
            Assert.That(result.Value.Id, Is.EqualTo(8));
            Assert.That(result.Value.Leci, Is.Not.Null);
        }

        [Test]
        public async Task GetPreporuka_BadId()
        {
            var result = await _controller.GetPreporuka(999);

            Assert.That(result.Result, Is.TypeOf<NotFoundResult>());
        }

        [Test]
        public async Task GetPreporuka_ImaLeci()
        {
            var result = await _controller.GetPreporuka(8);

            Assert.That(result.Value.Leci, Is.Not.Null);
        }

        // GetPreporukeLekar
        [Test]
        public async Task GetPreporukeLekar_Ok()
        {
            var result = await _controller.GetPreporukeLekar(4);

            Assert.That(result.Value, Is.Not.Empty);
            Assert.That(result.Value.Count, Is.EqualTo(2));
        }

        [Test]
        public async Task GetPreporukeLekar_BadId()
        {
            var result = await _controller.GetPreporukeLekar(999);

            Assert.That(result.Result, Is.Null);
        }

        [Test]
        public async Task GetPreporukeLekar_BezPreporuka()
        {
            var lekarId = 999;
            var result = await _controller.GetPreporukeLekar(lekarId);

            Assert.That(result.Value, Is.Empty);
        }

        // CreatePreporuka
        [Test]
        public async Task CreatePreporuka_Ok()
        {
            var preporuka = new Preporuka
            {
                Tekst = "Test preporuka",
                DatumOd = DateTime.UtcNow,
                DatumDo = DateTime.UtcNow.AddDays(10),
                Leci = _context.Lecenje.First()
            };

            var result = await _controller.CreatePreporuka(preporuka);

            Assert.That(result.Result, Is.TypeOf<CreatedAtActionResult>());
            var created = (result.Result as CreatedAtActionResult)!.Value as Preporuka;
            Assert.That(created, Is.Not.Null);
            Assert.That(created.Tekst, Is.EqualTo("Test preporuka"));
        }

        [Test]
        public async Task CreatePreporuka_BadLeci()
        {
            var preporuka = new Preporuka
            {
                Tekst = "Test",
                DatumOd = DateTime.UtcNow,
                DatumDo = DateTime.UtcNow.AddDays(5)
            };

            var result = await _controller.CreatePreporuka(preporuka);
            Assert.That(result.Result, Is.TypeOf<CreatedAtActionResult>());
        }

        [Test]
        public async Task CreatePreporuka_Duplicate()
        {
            var existing = _context.Preporuke.First();
            var preporuka = new Preporuka
            {
                Tekst = existing.Tekst,
                DatumOd = existing.DatumOd.ToUniversalTime(),
                DatumDo = existing.DatumDo.ToUniversalTime(),
                Leci = existing.Leci
            };

            var result = await _controller.CreatePreporuka(preporuka);
            Assert.That(result.Result, Is.TypeOf<CreatedAtActionResult>());
        }

        // UpdatePreporuka
        [Test]
        public async Task UpdatePreporuka_Ok()
        {
            var preporuka = _context.Preporuke.First();
            preporuka.Tekst = "Updated text";
            preporuka.DatumOd = preporuka.DatumOd.ToUniversalTime();
            preporuka.DatumDo = preporuka.DatumDo.ToUniversalTime();

            var result = await _controller.UpdatePreporuka(preporuka.Id, preporuka);

            Assert.That(result, Is.TypeOf<NoContentResult>());
        }

        [Test]
        public async Task UpdatePreporuka_BadId()
        {
            var preporuka = _context.Preporuke.First();
            var result = await _controller.UpdatePreporuka(999, preporuka);

            Assert.That(result, Is.TypeOf<BadRequestResult>());
        }

        [Test]
        public async Task UpdatePreporuka_NonExisting()
        {
            var preporuka = new Preporuka
            {
                Id = 999,
                Tekst = "Ne postoji"
            };
            _context.Entry(preporuka).State = EntityState.Modified;
            var result = await _controller.UpdatePreporuka(999, preporuka);
            Assert.That(result, Is.TypeOf<NotFoundResult>());
        }

        // DeletePreporuka
        [Test]
        public async Task DeletePreporuka_Ok()
        {
            var preporuka = _context.Preporuke.First();
            var result = await _controller.DeletePreporuka(preporuka.Id);

            var deleted = await _context.Preporuke.FindAsync(preporuka.Id);
            Assert.That(result, Is.TypeOf<NoContentResult>());
            Assert.That(deleted, Is.Null);
        }

        [Test]
        public async Task DeletePreporuka_BadId()
        {
            var result = await _controller.DeletePreporuka(999);

            Assert.That(result, Is.TypeOf<NotFoundResult>());
        }

        [Test]
        public async Task DeletePreporuka_OstaleOstaju()
        {
            var otherId = _context.Preporuke.Skip(1).First().Id;
            await _controller.DeletePreporuka(_context.Preporuke.First().Id);

            var other = await _context.Preporuke.FindAsync(otherId);
            Assert.That(other, Is.Not.Null);
        }
    }
}
