using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyBackend.DTOs;
using MyBackend.Models;

namespace MyBackend.Controllers
{
    [ApiController]
    [Route("lekar/[controller]")]
    public class LekarController : ControllerBase
    {
        private readonly BinkyContext _context;

        public LekarController(BinkyContext context)
        {
            _context = context;
        }

        [HttpGet("lekari")]
        public async Task<ActionResult<IEnumerable<Lekar>>> GetLekari()
        {
            return await _context.Lekari.ToListAsync();
        }

        [HttpGet("lekar/{id}")]
        public async Task<ActionResult<Lekar>> GetLekar(int id)
        {
            var lekar = await _context.Lekari.FindAsync(id);

            if (lekar == null)
            {
                return NotFound();
            }

            return lekar;
        }

        [HttpPost("dodaj_lekara")]
        public async Task<ActionResult<Lekar>> CreateLekar(Lekar lekar)
        {
            _context.Lekari.Add(lekar);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetLekar), new { id = lekar.Id }, lekar);
        }

        [HttpDelete("brisi_lekara/{id}")]
        public async Task<IActionResult> DeleteLekar(int id)
        {
            var lekar = await _context.Lekari.FindAsync(id);
            if (lekar == null)
            {
                return NotFound();
            }

            _context.Lekari.Remove(lekar);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpPut("promeni_lozinku/{id}")]
        public async Task<IActionResult> PromeniLozinku(int id, [FromBody] PromenaLozinkeDto lozinkaDTO)
        {
            if (string.IsNullOrEmpty(lozinkaDTO.TrenutnaLozinka) || string.IsNullOrEmpty(lozinkaDTO.NovaLozinka))
            {
                return BadRequest("Trenutna i nova lozinka su obavezne.");
            }
            
            var lekar = await _context.Lekari.FindAsync(id);

            if (lekar == null)
            {
                return NotFound("Lekar nije pronađen.");
            }
            
            if (!BCrypt.Net.BCrypt.Verify(lozinkaDTO.TrenutnaLozinka, lekar.Lozinka))
            {
                return BadRequest(new { message = "Uneta trenutna lozinka nije ispravna." });
            }

            if (lozinkaDTO.TrenutnaLozinka == lozinkaDTO.NovaLozinka)
            {
                return BadRequest(new { message = "Nova lozinka mora biti različita od trenutne." });
            }

            lekar.Lozinka = BCrypt.Net.BCrypt.HashPassword(lozinkaDTO.NovaLozinka);

             try
            {
                _context.Lekari.Update(lekar);
                await _context.SaveChangesAsync();
            }
            catch (Exception e)
            {
                return BadRequest(e.Message);
            }

            return NoContent();
        }
    }
}
