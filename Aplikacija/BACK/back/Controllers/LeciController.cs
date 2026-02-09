using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyBackend.Models;

namespace MyBackend.Controllers
{
    [ApiController]
    [Route("leci/[controller]")]
    public class LeciController : ControllerBase
    {
        private readonly BinkyContext _context;

        public LeciController(BinkyContext context)
        {
            _context = context;
        }

        [HttpGet("leci")]
        public async Task<ActionResult<IEnumerable<Leci>>> GetLecenja()
        {
            return await _context.Lecenje
                                 .Include(l => l.Lekar)
                                 .Include(l => l.Porodilja)
                                 .Where(l => l.Aktivno == true)
                                 .ToListAsync();
        }

        [HttpGet("leci/{id}")]
        public async Task<ActionResult<Leci>> GetLecenje(int id)
        {
            var lecenje = await _context.Lecenje
                                        .Include(l => l.Lekar)
                                        .Include(l => l.Porodilja)
                                        .FirstOrDefaultAsync(l => l.Id == id);
            if (lecenje == null)
            {
                return NotFound();
            }

            return lecenje;
        }

        [HttpGet("leci_porodilju/{idporodilje}")]
        public async Task<ActionResult<Leci>> GetLeciPorodilju(int idporodilje)
        {
            var lecenje = await _context.Lecenje
                .FirstOrDefaultAsync(l => l.IdPorodilje == idporodilje && l.Aktivno == true);
            if (lecenje == null)
            {
                return NotFound();
            }

            return lecenje;
        }

        [HttpGet("leciporodilje/{idPorodilje}")]
        public async Task<ActionResult<Leci>> GetLecenjePorodilje(int idPorodilje)
        {
            var lecenje = await _context.Lecenje.Where(l => l.IdPorodilje == idPorodilje && l.Aktivno == true)
                                        .Include(l => l.Lekar)
                                        .Include(l => l.Porodilja)
                                        .FirstOrDefaultAsync();
            if (lecenje == null)
            {
                return NotFound();
            }

            return lecenje;
        }

        [HttpGet("porodilje_lekara/{idlekara}")]
        public async Task<ActionResult<Porodilja>> GetPorodiljeZaLekara(int idlekara)
        {
           var lecenja = await _context.Lecenje
                .Where(l => l.IdLekara == idlekara && l.Aktivno == true)
                .Include(l => l.Porodilja)
                .Where(l=> l.Porodilja!.SePorodila==false)
                .ToListAsync();

            if (lecenja == null || !lecenja.Any())
            {
                return NotFound("Nema aktivnih pacijentkinja za ovog lekara.");
            }

            return Ok(lecenja);
        }

        [HttpPost("dodaj_leci")]
        public async Task<ActionResult<Leci>> CreateLecenje(Leci lecenje)
        {
            var staroLecenje = _context.Lecenje
                .Where(l => l.IdPorodilje == lecenje.IdPorodilje)
                .Where(l => l.Aktivno == true)
                .FirstOrDefault();
            if (staroLecenje != null)
            {
                staroLecenje.Aktivno = false;
                _context.Entry(staroLecenje).State = EntityState.Modified;
            }

            _context.Lecenje.Add(lecenje);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetLecenje), new { id = lecenje.Id }, lecenje);
        }


        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLecenje(int id)
        {
            var lecenje = await _context.Lecenje.FindAsync(id);
            if (lecenje == null)
            {
                return NotFound();
            }

            _context.Lecenje.Remove(lecenje);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
