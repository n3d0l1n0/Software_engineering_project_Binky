using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyBackend.Models;

namespace MyBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RezultatController : ControllerBase
    {
        private readonly BinkyContext _context;

        public RezultatController(BinkyContext context)
        {
            _context = context;
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Rezultat>> GetRezultat(int id)
        {
            var rezultat = await _context.Rezultati
                .Include(r => r.Pregled)
                    .ThenInclude(p => p!.Leci)
                .Include(r => r.Pregled)
                    .ThenInclude(p => p!.TipPregleda)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (rezultat == null)
                return NotFound();

            return rezultat;
        }

        [HttpPost("dodaj_rezultat")]
        public async Task<ActionResult<Rezultat>> CreateRezultat(Rezultat rezultat)
        {
            Console.WriteLine("Server: "+ rezultat);
            _context.Rezultati.Add(rezultat);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetRezultat), new { id = rezultat.Id }, rezultat);
        }

        [HttpDelete("brisi_rezultat/{id}")]
        public async Task<IActionResult> DeleteRezultat(int id)
        {
            var rezultat = await _context.Rezultati.FindAsync(id);
            if (rezultat == null)
                return NotFound();

            _context.Rezultati.Remove(rezultat);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        [HttpGet("rezultati_za_pregled/{idPregleda}")]
        public async Task<ActionResult<IEnumerable<Rezultat>>> GetRezultatiZaPregled(int idPregleda)
        {
            var rezultati = await _context.Rezultati
                .Where(r => r.IdPregleda == idPregleda)
                .OrderByDescending(r => r.Datum)
                .ToListAsync();
                
            foreach (var rezultat in rezultati)
                    {
                        if (rezultat.Datum.Kind == DateTimeKind.Unspecified)
                        {
                            rezultat.Datum = DateTime.SpecifyKind(rezultat.Datum, DateTimeKind.Utc);
                        }
                        else if (rezultat.Datum.Kind == DateTimeKind.Local)
                        {
                            rezultat.Datum = rezultat.Datum.ToUniversalTime();
                        }
                    }


            return Ok(rezultati);
        }

        [HttpGet("rezultatui_porodilja/{idPorodilje}")]
        public async Task<ActionResult<IEnumerable<Rezultat>>> GetRezultatiZaPorodilju(int idPorodilje)
        {
            var rezultati = await _context.Rezultati
                .Include(r => r.Pregled)
                    .ThenInclude(p => p!.Leci)
                .Include(r => r.Pregled)
                    .ThenInclude(p => p!.TipPregleda)
                .Where(r => r.Pregled!.Leci!.IdPorodilje == idPorodilje)
                .ToListAsync();

            return Ok(rezultati);
        }
    }
}
