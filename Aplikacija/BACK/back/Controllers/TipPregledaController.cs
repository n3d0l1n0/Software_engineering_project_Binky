using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MyBackend.Models;

namespace MyBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TipPregledaController : ControllerBase
    {
        private readonly BinkyContext _context;

        public TipPregledaController(BinkyContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<TipPregleda>>> GetTipovePregleda()
        {
            var tipovi = await _context.TipoviPregleda.ToListAsync();
            return Ok(tipovi);
        }
    }
}
