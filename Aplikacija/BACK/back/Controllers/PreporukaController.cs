using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyBackend.Models;

namespace MyBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PreporukaController : ControllerBase
    {
        private readonly BinkyContext _context;

        public PreporukaController(BinkyContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetPreporuke()
        {
            return await _context.Preporuke
                                  .Include(p => p.Leci)
                                  .ThenInclude(l => l.Porodilja)
                                  .Where(p => p.Leci!.Porodilja!.SePorodila == false)
                                            .Select(p => new
                                            {
                                                id = p.Id,
                                                tekst = p.Tekst,
                                                datumOd = p.DatumOd,
                                                datumDo = p.DatumDo,
                                                imeIPrezime = p.Leci!.Porodilja!.ImeIPrezime
                                            })
                                 .ToListAsync();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Preporuka>> GetPreporuka(int id)
        {
            var preporuka = await _context.Preporuke
                                          .Include(p => p.Leci)
                                          .ThenInclude(l => l.Porodilja)
                                          .FirstOrDefaultAsync(p => p.Id == id);
            if (preporuka == null)
            {
                return NotFound();
            }

            return preporuka;
        }

        [HttpGet("porodilja/{idPorodilje}")]
        public async Task<ActionResult<IEnumerable<object>>> GetVazecePreporukeZaPorodilju(int idPorodilje)
        {
            var preporuke = await _context.Preporuke
                .Include(p => p.Leci)
                .Where(p => p.Leci!.IdPorodilje == idPorodilje)
                .Where(p =>
                    DateOnly.FromDateTime(p.DatumOd) <= DateOnly.FromDateTime(DateTime.Now) &&
                    DateOnly.FromDateTime(p.DatumDo) >= DateOnly.FromDateTime(DateTime.Now)
                )
                .Select(p => new
                {
                    Id = p.Id,
                    Tekst = p.Tekst,
                    DatumOd = p.DatumOd,
                    DatumDo = p.DatumDo,
                    IdLekara = p.Leci!.IdLekara
                })
                .ToListAsync();

            if (!preporuke.Any())
                return NotFound($"Nema preporuka za porodilju sa ID = {idPorodilje}.");

            return Ok(preporuke);
        }

        [HttpGet("lekar/{lekarId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetPreporukeLekar(int lekarId)
        {
            if (lekarId <= 0)
            {
                return BadRequest("Nije unet validan ID lekara.");
            }

            return await _context.Preporuke
                                .Include(p => p.Leci)
                                .ThenInclude(l => l.Porodilja)
                                .Where(p => p.Leci.IdLekara == lekarId)
                                .Select(p => new
                                {
                                    id = p.Id,
                                    tekst = p.Tekst,
                                    datumOd = p.DatumOd,
                                    datumDo = p.DatumDo,
                                    imeIPrezime = p.Leci.Porodilja.ImeIPrezime
                                })
                                .ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<Preporuka>> CreatePreporuka(Preporuka preporuka)
        {
            _context.Preporuke.Add(preporuka);
            await _context.SaveChangesAsync();

            var novokreiranaPreporuka = await _context.Preporuke
                .Include(p => p.Leci)
                    .ThenInclude(l => l.Porodilja)
                .FirstOrDefaultAsync(p => p.Id == preporuka.Id);

            return CreatedAtAction(nameof(GetPreporuka), new { id = preporuka.Id }, novokreiranaPreporuka);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePreporuka(int id, Preporuka preporuka)
        {
            if (id != preporuka.Id)
            {
                return BadRequest();
            }

            _context.Entry(preporuka).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Preporuke.Any(e => e.Id == id))
                {
                    return NotFound();
                }
                throw;
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePreporuka(int id)
        {
            var preporuka = await _context.Preporuke.FindAsync(id);
            if (preporuka == null)
            {
                return NotFound();
            }

            _context.Preporuke.Remove(preporuka);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
