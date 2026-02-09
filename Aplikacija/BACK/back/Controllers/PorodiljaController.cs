using System.Security.Cryptography;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyBackend.DTOs;
using MyBackend.Models;
using MyBackend.Services;

namespace MyBackend.Controllers
{
    [ApiController]
    [Route("porodilja/[controller]")]
    public class PorodiljaController : ControllerBase
    {
        private readonly BinkyContext _context;
        private readonly IEncryptionService _encryptionService;

        public PorodiljaController(BinkyContext context, IEncryptionService encryptionService)
        {
            _context = context;
            _encryptionService = encryptionService;
        }

        [HttpGet("porodilja/{id}")]
        public async Task<ActionResult<Porodilja>> GetPorodilja(int id)
        {
            var porodilja = await _context.Porodilje.FindAsync(id);

            if (porodilja == null)
            {
                return NotFound();
            }

            return porodilja;
        }

        [HttpGet("jmbg/{jmbg}")]
        public async Task<ActionResult<Porodilja>> GetPorodiljaByJmbg(string jmbg)
        {
            var svePorodilje = await _context.Porodilje.ToListAsync();
            var porodilja = svePorodilje.FirstOrDefault(p =>
            {
                try
                {
                    string decryptedJMBG = _encryptionService.Decrypt(p.JMBG);
                    return decryptedJMBG == jmbg;
                }
                catch (FormatException)
                {
                    return false;
                }
                catch (CryptographicException)
                {
                    return false;
                }
            });
            if (porodilja == null)
            {
                return NotFound();
            }
            porodilja.JMBG = "";
            return Ok(porodilja);
        }

        [HttpPost("porodilja")]
        public async Task<ActionResult<Porodilja>> CreatePorodilja(Porodilja porodilja)
        {
            _context.Porodilje.Add(porodilja);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPorodilja), new { id = porodilja.Id }, porodilja);
        }

        [HttpPut("porodilja/{id}")]
        public async Task<IActionResult> UpdatePorodilja(int id, Porodilja porodilja)
        {
            if (id != porodilja.Id)
            {
                return BadRequest();
            }

            _context.Entry(porodilja).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Porodilje.Any(e => e.Id == id))
                {
                    return NotFound();
                }
                throw;
            }

            return NoContent();
        }

        [HttpPut("porodila_se/{id}")]
        public async Task<IActionResult> PorodilaSe(int id)
        {
            var porodilja = await _context.Porodilje.FindAsync(id);
            if (porodilja == null)
            {
                return NotFound();
            }

            porodilja.SePorodila = true;

            porodilja.DatumRodjenja = DateTime.SpecifyKind(porodilja.DatumRodjenja, DateTimeKind.Utc);
            porodilja.PocetakTrudnoce = DateTime.SpecifyKind(porodilja.PocetakTrudnoce, DateTimeKind.Utc);

            _context.Entry(porodilja).State = EntityState.Modified;
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Porodilje.Any(e => e.Id == id))
                {
                    return NotFound();
                }
                throw;
            }

            return NoContent();
        }

        [HttpDelete("porodilja/{id}")]
        public async Task<IActionResult> DeletePorodilja(int id)
        {
            var porodilja = await _context.Porodilje.FindAsync(id);
            if (porodilja == null)
            {
                return NotFound();
            }

            _context.Porodilje.Remove(porodilja);
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

            var porodilja = await _context.Porodilje.FindAsync(id);

            if (porodilja == null)
            {
                return NotFound("Porodilja nije pronađena.");
            }

            if (!BCrypt.Net.BCrypt.Verify(lozinkaDTO.TrenutnaLozinka, porodilja.Lozinka))
            {
                return BadRequest(new { message = "Uneta trenutna lozinka nije ispravna." });
            }

            if (lozinkaDTO.TrenutnaLozinka == lozinkaDTO.NovaLozinka)
            {
                return BadRequest(new { message = "Nova lozinka mora biti različita od trenutne." });
            }

            porodilja.Lozinka = BCrypt.Net.BCrypt.HashPassword(lozinkaDTO.NovaLozinka);

             try
            {
                _context.Porodilje.Update(porodilja);
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
