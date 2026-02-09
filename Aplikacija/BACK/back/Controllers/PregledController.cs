using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyBackend.Models;
using MyBackend.DTOs;

namespace MyBackend.Controllers
{
    [ApiController]
    [Route("pregled/[controller]")]
    public class PregledController : ControllerBase
    {
        private readonly BinkyContext _context;

        public PregledController(BinkyContext context)
        {
            _context = context;
        }

        [HttpGet("slobodni_termini_za_porodilje/{idPorodilje}/{datum}/{idTipaPregleda}")]
        public async Task<ActionResult<IEnumerable<DateTime>>> GetSlobodniTermini(
            int idPorodilje, DateTime datum, int idTipaPregleda)
        {
            DateTime utcdatum = DateTime.SpecifyKind(datum, DateTimeKind.Utc);

            var leci = await _context.Lecenje
                .Include(l => l.Lekar)
                .FirstOrDefaultAsync(l => l.IdPorodilje == idPorodilje && l.Aktivno);

            if (leci == null)
                return BadRequest("Porodilja nema aktivnog lekara.");

            int idLekara = leci.IdLekara;

            var tip = await _context.TipoviPregleda.FindAsync(idTipaPregleda);
            if (tip == null)
                return BadRequest("Nepostojeci tip pregleda.");

            int trajanjeMin = tip.VremeTrajanja;

            var pocetakDana = new DateTime(utcdatum.Year, utcdatum.Month, utcdatum.Day, 8, 0, 0, DateTimeKind.Utc);
            var krajDana = new DateTime(utcdatum.Year, utcdatum.Month, utcdatum.Day, 16, 0, 0, DateTimeKind.Utc);

            var zakazani = await _context.Pregledi
                .Where(p => p.Leci!.IdLekara == idLekara &&
                            p.Termin.Date == utcdatum.Date &&
                            p.JePotvrdjen)
                .Include(p => p.TipPregleda)
                .ToListAsync();

            var slobodniTermini = new List<DateTime>();
            var current = pocetakDana;

            while (current.AddMinutes(trajanjeMin) <= krajDana)
            {
                bool zauzet = zakazani.Any(z =>
                {
                    var zPocetak = z.Termin;
                    var zKraj = z.Termin.AddMinutes(z.TipPregleda!.VremeTrajanja);

                    var noviPocetak = current;
                    var noviKraj = current.AddMinutes(trajanjeMin);

                    return noviPocetak < zKraj && zPocetak < noviKraj;
                });

                if (!zauzet)
                    slobodniTermini.Add(current);

                current = current.AddMinutes(15);
            }

            return slobodniTermini;
        }

        [HttpPost("zakazi")]
        public async Task<ActionResult<Pregled>> ZakaziPregled([FromBody] ZakaziPregledDto dto)
        {
            var leci = await _context.Lecenje.FirstOrDefaultAsync(l => l.IdPorodilje == dto.IdPorodilje && l.Aktivno);

            if (leci == null) return BadRequest("Porodilja nema aktivnog lekara.");
            var tip = await _context.TipoviPregleda.FindAsync(dto.IdTipaPregleda);
            if (tip == null) return BadRequest("Nepostojeci tip pregleda.");

            var terminUtc = DateTime.SpecifyKind(dto.Termin, DateTimeKind.Utc);

            var pregled = new Pregled
            {
                IdLeci = leci.Id,
                Termin = terminUtc,
                IdTipaPregleda = dto.IdTipaPregleda,
                JePotvrdjen = false
            };

            _context.Pregledi.Add(pregled);
            await _context.SaveChangesAsync();

            return Ok(pregled);
        }
    
        [HttpGet("zahtevi/{idLekara}")] //ZA LEKAROV INTERFEJS
        public async Task<ActionResult<IEnumerable<object>>> GetZahteviZaPregled(int idLekara)
        {
            var zahtevi = await _context.Pregledi
                .Where(p => p.Leci!.IdLekara == idLekara && p.JePotvrdjen == false)
                .Select(p => new  
                {
                    Id = p.Id,
                    Termin = DateTime.SpecifyKind(p.Termin, DateTimeKind.Utc),
                    Leci = new 
                    {
                        Porodilja = new 
                        {
                            ImeIPrezime = p.Leci!.Porodilja != null ? p.Leci.Porodilja.ImeIPrezime : "Nepoznato"
                        }
                    },
                    TipPregleda = new 
                    {
                        Naziv = p.TipPregleda != null ? p.TipPregleda.Naziv : "Nepoznato"
                    }
                })
                .ToListAsync();

            return Ok(zahtevi);
        }

        [HttpPut("prihvati/{id}")] //ZA LEKAROV INTERFEJS
        public async Task<IActionResult> PrihvatiPregled(int id)
        {
            var pregled = await _context.Pregledi.FindAsync(id);
            if (pregled == null)
                return NotFound("Pregled ne postoji.");

            pregled.JePotvrdjen = true; 

            var properties = pregled.GetType().GetProperties()
                .Where(p => p.PropertyType == typeof(DateTime) || p.PropertyType == typeof(DateTime?));

            foreach (var property in properties)
            {
                if (property.GetValue(pregled) is DateTime dt)
                {
                    property.SetValue(pregled, DateTime.SpecifyKind(dt, DateTimeKind.Utc));
                }
            }

            _context.Entry(pregled).State = EntityState.Modified;

            await _context.SaveChangesAsync();
            return Ok("Pregled uspešno prihvaćen.");
        }

        [HttpDelete("odbij/{id}")] //ZA LEKAROV INTERFEJS
        public async Task<IActionResult> OdbijPregled(int id)
        {
            var pregled = await _context.Pregledi.FindAsync(id);
            if (pregled == null)
                return NotFound("Pregled ne postoji.");

            _context.Pregledi.Remove(pregled);
            await _context.SaveChangesAsync();

            return Ok("Pregled uspešno odbijen i obrisan.");
        }

        [HttpGet("raspored")]
        public async Task<ActionResult<IEnumerable<object>>> GetRasporedZaDan([FromQuery] int idLekara, [FromQuery] DateTime datum)
        {
            try
            {
                var datumUtc = DateTime.SpecifyKind(datum, DateTimeKind.Utc);

                var pocetakDana = datumUtc.Date; 
                var krajDana = pocetakDana.AddDays(1);

                var raspored = await _context.Pregledi
                    .Where(p => p.Leci != null && p.Leci.IdLekara == idLekara
                                && p.JePotvrdjen == true
                                && p.Termin >= pocetakDana 
                                && p.Termin < krajDana
                                && p.Leci!.Porodilja!.SePorodila == false)
                    .OrderBy(p => p.Termin)
                    .Select(p => new
                    {
                        PregledId = p.Id,
                        Termin = p.Termin,
                        Porodilja = p.Leci.Porodilja != null ? p.Leci.Porodilja.ImeIPrezime : "Nepoznato",
                        TipPregleda = p.TipPregleda != null ? p.TipPregleda.Naziv : "Nepoznato",
                        Trajanje = p.TipPregleda != null ? p.TipPregleda.VremeTrajanja : 0
                    })
                    .ToListAsync(); 

                return Ok(raspored);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Došlo je do interne greške na serveru: {ex.Message}");
            }
        }


        [HttpGet("prosli/{idPorodilje}")] //ZA PORODILJIN INTERFEJS
        public async Task<ActionResult<IEnumerable<object>>> GetProsliPregledi(int idPorodilje)
        {
            var danas = DateTime.UtcNow;

            var pregledi = await _context.Pregledi
                .Include(p => p.Leci)
                    .ThenInclude(l => l!.Lekar)
                .Include(p => p.TipPregleda)
                .Where(p => p.Leci!.IdPorodilje == idPorodilje 
                            && p.JePotvrdjen == true
                            && p.Termin.Date < danas)
                .OrderByDescending(p => p.Termin)
                .ToListAsync();

            var rezultat = pregledi.Select(p => new
            {
                PregledId = p.Id,
                Termin = p.Termin,
                TipPregleda = p.TipPregleda!.Naziv,
                Trajanje = p.TipPregleda.VremeTrajanja,
                DozvoljenoPrikazivanje = p.DozvoljenoPrikazivanje,
                Lekar = p.Leci!.Lekar != null ? p.Leci.Lekar.ImeIPrezime : "Nepoznat"
            });

            return Ok(rezultat);
        }

        [HttpGet("buduci/{idPorodilje}")] //ZA PORODILJIN INTERFEJS
        public async Task<ActionResult<IEnumerable<object>>> GetBuduciPregledi(int idPorodilje)
        {
            var danas = DateTime.UtcNow.Date; 


            var pregledi = await _context.Pregledi
                .Include(p => p.Leci)
                    .ThenInclude(l => l.Lekar)
                .Include(p => p.TipPregleda)
                .Where(p => p.Leci!.IdPorodilje == idPorodilje 
                            && p.JePotvrdjen == true
                            && p.Termin.Date >= danas)
                .OrderBy(p => p.Termin)
                .ToListAsync();

            var rezultat = pregledi.Select(p => new
            {
                PregledId = p.Id,
                Termin = p.Termin,
                TipPregleda = p.TipPregleda!.Naziv,
                Trajanje = p.TipPregleda.VremeTrajanja,
                Lekar = p.Leci!.Lekar != null ? p.Leci.Lekar.ImeIPrezime : "Nepoznat"
            });

            return Ok(rezultat);
        }

        [HttpGet("zahtevi_nepotvrdjeni/{idPorodilje}")] //ZA PORODILJIN INTERFEJS
        public async Task<ActionResult<IEnumerable<object>>> GetNepotvrdjeniZahtevi(int idPorodilje)
        {
            var danas = DateTime.UtcNow.Date;
            var pregledi = await _context.Pregledi
                .Include(p => p.Leci)
                    .ThenInclude(l => l.Lekar)
                .Include(p => p.TipPregleda)
                .Where(p => p.Leci!.IdPorodilje == idPorodilje 
                            && p.JePotvrdjen == false
                            && p.Termin.Date >= danas)
                .OrderBy(p => p.Termin)
                .ToListAsync();

            var rezultat = pregledi.Select(p => new
            {
                PregledId = p.Id,
                Termin = p.Termin,
                TipPregleda = p.TipPregleda!.Naziv,
                Trajanje = p.TipPregleda.VremeTrajanja,
                Lekar = p.Leci!.Lekar != null ? p.Leci.Lekar.ImeIPrezime : "Nepoznat"
            });

            return Ok(rezultat);
        }
        [HttpGet("datumi-pregleda/{idLekara}")] //ZA LEKARA
        public async Task<ActionResult<IEnumerable<DateTime>>> GetDatumiPregleda(int idLekara)
        {
            var datumi = await _context.Pregledi
                .Where(p => p.Leci != null && p.Leci.IdLekara == idLekara && p.JePotvrdjen && p.Leci.Porodilja.SePorodila == false)
                .Select(p => p.Termin.Date)
                .Distinct()
                .ToListAsync();

            return Ok(datumi);
        }

        [HttpGet("dozvoljeni-pregledi/{id}")]
        public async Task<ActionResult<IEnumerable<object>>> GetDozvoljeniPregledi(int id)
        {
            var porodilja = await _context.Porodilje.Where(p=> p.Id==id).FirstOrDefaultAsync();

            if (porodilja == null)
            {
                return NotFound("Porodilja nije pronađena.");
            }

            var pregledi = await _context.Pregledi
                .Include(p => p.TipPregleda)
                .Where(p => p.Leci!.IdPorodilje == porodilja.Id && p.DozvoljenoPrikazivanje == true)
                .OrderByDescending(p => p.Termin)
                .Select(p => new 
                {
                    PregledId = p.Id,
                    Termin = p.Termin,
                    TipPregleda = p.TipPregleda != null ? p.TipPregleda.Naziv : "Nepoznato",
                    Trajanje = p.TipPregleda != null ? p.TipPregleda.VremeTrajanja : 0,
                    Lekar = p.Leci!.Lekar != null ? p.Leci.Lekar.ImeIPrezime : "Nepoznat"
                })
                .ToListAsync();
                
            return Ok(pregledi);
        }

        [HttpGet("pregled/{id}")]
        public async Task<ActionResult<Pregled>> GetPregled(int id)
        {
            var pregled = await _context.Pregledi
                                        .Include(p => p.Leci)
                                        .Include(p => p.TipPregleda)
                                        .Include(p => p.Rezultati)
                                        .FirstOrDefaultAsync(p => p.Id == id);

            if (pregled == null)
            {
                return NotFound();
            }

            return pregled;
        }

        [HttpPost("pregled")]
        public async Task<ActionResult<Pregled>> CreatePregled(Pregled pregled)
        {
            _context.Pregledi.Add(pregled);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPregled), new { id = pregled.Id }, pregled);
        }

        [HttpPut("pregled/{id}")]
        public async Task<IActionResult> UpdatePregled(int id, Pregled pregled)
        {
            if (id != pregled.Id)
            {
                return BadRequest();
            }

            _context.Entry(pregled).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Pregledi.Any(e => e.Id == id))
                {
                    return NotFound();
                }
                throw;
            }

            return NoContent();
        }

        [HttpDelete("pregled/{id}")]
        public async Task<IActionResult> DeletePregled(int id)
        {
            var pregled = await _context.Pregledi.FindAsync(id);
            if (pregled == null)
            {
                return NotFound();
            }

            _context.Pregledi.Remove(pregled);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        [HttpPatch("pregled/{id}/dozvoljenoPrikazivanje")]
        public async Task<IActionResult> UpdateDozvoljenoPrikazivanje(int id, [FromQuery] bool dozvoljenoPrikazivanje)
        {
            var pregled = await _context.Pregledi.FindAsync(id);
            if (pregled == null)
                return NotFound();

            pregled.DozvoljenoPrikazivanje = dozvoljenoPrikazivanje;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Pregledi.Any(e => e.Id == id))
                    return NotFound();
                throw;
            }

            return NoContent();
        }
    }
}