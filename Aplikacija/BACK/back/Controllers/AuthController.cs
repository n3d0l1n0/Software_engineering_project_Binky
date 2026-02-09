using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyBackend.Models;
using MyBackend.DTOs;
using MyBackend.Services;
using System.Security.Claims;

namespace MyBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly BinkyContext _context;
        private readonly TokenService _tokenService;
        private readonly IEncryptionService _encryptionService;

        public AuthController(BinkyContext context, TokenService tokenService, IEncryptionService encryptionService)
        {
            _context = context;
            _tokenService = tokenService;
            _encryptionService = encryptionService;
        }

        [HttpPost("register/porodilja")]
        public async Task<IActionResult> RegisterPorodilja([FromBody] RegisterPorodiljaDto dto)
        {
            Console.WriteLine("Received data: " + dto);
            string encriptedJMBG = _encryptionService.Encrypt(dto.JMBG);

            if (await _context.Porodilje.AnyAsync(p => p.JMBG == encriptedJMBG))
                return BadRequest("Već postoji korisnik sa ovim JMBG-om.");

            if (await _context.Porodilje.AnyAsync(p => p.Email == dto.Email))
                return BadRequest("Email je već u upotrebi.");

            dto.DatumRodjenja = DateTime.SpecifyKind(dto.DatumRodjenja, DateTimeKind.Utc);
            dto.PocetakTrudnoce = DateTime.SpecifyKind(dto.PocetakTrudnoce, DateTimeKind.Utc);

            var porodilja = new Porodilja
            {
                ImeIPrezime = dto.ImeIPrezime,
                DatumRodjenja = dto.DatumRodjenja,
                Email = dto.Email,
                Lozinka = BCrypt.Net.BCrypt.HashPassword(dto.Lozinka),
                Telefon = dto.Telefon,
                JMBG = encriptedJMBG,
                LBO = dto.LBO,
                PocetakTrudnoce = dto.PocetakTrudnoce,
                SePorodila = false
            };

            try
            {
                _context.Porodilje.Add(porodilja);
                await _context.SaveChangesAsync();
            }
            catch(Exception ex)
            {
                Console.WriteLine("Error saving to database: " + ex.Message);
                return StatusCode(500, new
                {
                    message = "Došlo je do greške prilikom registracije."
                });
            }

            Console.WriteLine("New Porodilja ID: " + porodilja.Id);
            return Ok(new { message = "Registracija uspešna!", userId = porodilja.Id });
        }

        [HttpPatch("porodilja/{id}/profilna-slika")]
        public async Task<IActionResult> UpdatePorodiljaProfilePicture(int id, [FromBody] ProfilePictureUpdateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.ProfilnaSlika))
            {
                return BadRequest("URL profilne slike je obavezan.");
            }

            var porodilja = await _context.Porodilje.FindAsync(id);

            if (porodilja == null)
            {
                return NotFound($"Porodilja sa ID-jem {id} nije pronađena.");
            }

            porodilja.ProfilnaSlika = dto.ProfilnaSlika;

            try
            {
                await _context.SaveChangesAsync();
                return Ok(new { message = "URL profilne slike uspešno sačuvan!" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Greška prilikom ažuriranja URL-a slike za porodilju ID {id}: {ex.Message}");
                return StatusCode(500, new { message = "Došlo je do greške prilikom čuvanja URL-a slike u bazi." });
            }
        }

        [HttpPost("login/porodilja")]
        public async Task<IActionResult> LoginPorodilja([FromBody] LoginDto dto)
        {
            var porodilja = await _context.Porodilje.FirstOrDefaultAsync(p => p.Email == dto.Email);
            if (porodilja == null)
                return Unauthorized("Pogrešan email ili lozinka.");

            if (!BCrypt.Net.BCrypt.Verify(dto.Lozinka, porodilja.Lozinka))
                return Unauthorized("Pogrešna email ili lozinka.");

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, porodilja.Id.ToString()),
                new Claim(ClaimTypes.Email, porodilja.Email),
            };

            var token = _tokenService.CreateToken(claims);

            return Ok(new
            {
                message = "Login uspešan!",
                userId = porodilja.Id,
                role = "Porodilja",
                token = token
            });
        }

        [HttpPost("login/lekar")]
        public async Task<IActionResult> LoginLekar([FromBody] LoginDto dto)
        {
            var lekar = await _context.Lekari.FirstOrDefaultAsync(l => l.Email == dto.Email);
            if (lekar == null)
                return Unauthorized("Pogrešan email ili lozinka.");

            if (!BCrypt.Net.BCrypt.Verify(dto.Lozinka, lekar.Lozinka))
                return Unauthorized("Pogrešna email ili lozinka.");

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, lekar.Id.ToString()),
                new Claim(ClaimTypes.Email, lekar.Email),
            };

            var token = _tokenService.CreateToken(claims);

            return Ok(new
            {
                message = "Login uspešan!",
                userId = lekar.Id,
                role = "Lekar",
                token = token
            });
        }
    }
}
