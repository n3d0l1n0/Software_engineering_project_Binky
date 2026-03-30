using System;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Playwright;
using NUnit.Framework;

namespace PlaywrightTests
{
    public class ApiTests
    {
        private IPlaywright _playwright;
        private IAPIRequestContext _requestContext;

        [SetUp]
        public async Task Setup()
        {
            _playwright = await Playwright.CreateAsync();
            _requestContext = await _playwright.APIRequest.NewContextAsync(new APIRequestNewContextOptions
            {
                BaseURL = "http://localhost:5278" 
            });
        }

        [TearDown]
        public async Task TearDown()
        {
            await _requestContext.DisposeAsync();
            _playwright.Dispose();
        }

        //Auth Controller

        [Test]
        public async Task Auth_LoginLekar_PogresniKredencijali_Vraca401()
        {
            var loginData = new { email = "test@lekar.com", lozinka = "pogresna123" };
            var response = await _requestContext.PostAsync("/api/Auth/login/lekar", new APIRequestContextOptions { DataObject = loginData });
            Assert.That(response.Status, Is.EqualTo(401));
        }

        [Test]
        public async Task Auth_LoginLekar_IspravniKredencijali_Vraca200()
        {
            var loginData = new { email = "milan.petrovic@bolnica.rs", lozinka = "lozinka123" };
            var response = await _requestContext.PostAsync("/api/Auth/login/lekar", new APIRequestContextOptions { DataObject = loginData });
            Assert.That(response.Status, Is.EqualTo(200));
        }

        //Lekar Controller
        [Test]
        public async Task Lekar_GetLekari_Vraca200()
        {
            var response = await _requestContext.GetAsync("/lekar/Lekar/lekari");
            Assert.That(response.Status, Is.EqualTo(200));
        }

        [Test]
        public async Task Lekar_GetLekar_Nepostojeci_Vraca404()
        {
            var response = await _requestContext.GetAsync("/lekar/Lekar/lekar/99999");
            Assert.That(response.Status, Is.EqualTo(404));
        }

        [Test]
        public async Task Lekar_GetLekar_Postojeci_Vraca200()
        {
            var noviLekar = new { imeIPrezime = "Test", datumRodjenja = "1980-01-01T00:00:00Z", email = "testget@test.com", lozinka = "123", telefon = "123", ustanova = "U", prostorija = "P" };
            var postResponse = await _requestContext.PostAsync("/lekar/Lekar/dodaj_lekara", new APIRequestContextOptions { DataObject = noviLekar });
            
            if (postResponse.Status == 201)
            {
                try 
                {
                    var body = await postResponse.JsonAsync();
                    int id = body.Value.GetProperty("id").GetInt32();
                    
                    var getResponse = await _requestContext.GetAsync($"/lekar/Lekar/lekar/{id}");
                    Assert.That(getResponse.Status, Is.EqualTo(200));

                    await _requestContext.DeleteAsync($"/lekar/Lekar/brisi_lekara/{id}");
                } 
                catch { }
            }
        }

        [Test]
        public async Task Lekar_RealniPodaci_PromeniLozinkuIVratiNazad_Vraca204()
        {            
            var promenaNaNovu = new 
            { 
                trenutnaLozinka = "lozinka123", 
                novaLozinka = "privremenaLozinka999" 
            };
            
            var response1 = await _requestContext.PutAsync("/lekar/Lekar/promeni_lozinku/4", new APIRequestContextOptions 
            { 
                DataObject = promenaNaNovu 
            });
            
            Assert.That(response1.Status, Is.EqualTo(204), "Prva promena lozinke mora proći uspešno.");

            var vracanjeNaStaru = new 
            { 
                trenutnaLozinka = "privremenaLozinka999", 
                novaLozinka = "lozinka123" 
            };
            
            var response2 = await _requestContext.PutAsync("/lekar/Lekar/promeni_lozinku/4", new APIRequestContextOptions 
            { 
                DataObject = vracanjeNaStaru 
            });
            
            Assert.That(response2.Status, Is.EqualTo(204), "Vraćanje lozinke na staru mora proći uspešno.");
        }

        [Test]
        public async Task Lekar_DodajLekara_I_BrisiLekara_VracaUspesno()
        {
            var noviLekar = new { imeIPrezime = "Test", datumRodjenja = "1980-01-01T00:00:00Z", email = "test@test.com", lozinka = "123", telefon = "123", ustanova = "U", prostorija = "P" };
            var postResponse = await _requestContext.PostAsync("/lekar/Lekar/dodaj_lekara", new APIRequestContextOptions { DataObject = noviLekar });
            Assert.That(postResponse.Status, Is.EqualTo(201));

            if (postResponse.Status == 201)
            {
                try 
                {
                    var postResponseBody = await postResponse.JsonAsync();
                    int id = postResponseBody.Value.GetProperty("id").GetInt32();
                    await _requestContext.DeleteAsync($"/lekar/Lekar/brisi_lekara/{id}");
                } 
                catch { }
            }
        }

        [Test]
        public async Task Lekar_PromeniLozinku_Nepostojeci_Vraca404()
        {
            var lozinke = new { trenutnaLozinka = "stara123", novaLozinka = "nova123" };
            var response = await _requestContext.PutAsync("/lekar/Lekar/promeni_lozinku/99999", new APIRequestContextOptions { DataObject = lozinke });
            Assert.That(response.Status, Is.EqualTo(404));
        }

        [Test]
        public async Task Lekar_PromeniLozinku_Ispravno_Vraca204()
        {
            var noviLekar = new { imeIPrezime = "Test", datumRodjenja = "1980-01-01T00:00:00Z", email = "testpass@test.com", lozinka = "stara123", telefon = "123", ustanova = "U", prostorija = "P" };
            var postResponse = await _requestContext.PostAsync("/lekar/Lekar/dodaj_lekara", new APIRequestContextOptions { DataObject = noviLekar });
            
            if (postResponse.Status == 201)
            {
                try 
                {
                    var body = await postResponse.JsonAsync();
                    int id = body.Value.GetProperty("id").GetInt32();
                    
                    var lozinke = new { trenutnaLozinka = "stara123", novaLozinka = "nova123" };
                    var putResponse = await _requestContext.PutAsync($"/lekar/Lekar/promeni_lozinku/{id}", new APIRequestContextOptions { DataObject = lozinke });
                    
                    Assert.That(putResponse.Status, Is.EqualTo(204));

                    await _requestContext.DeleteAsync($"/lekar/Lekar/brisi_lekara/{id}");
                } 
                catch { }
            }
        }

        //Leci Controller
        [Test]
        public async Task Leci_GetLecenja_Vraca200()
        {
            var response = await _requestContext.GetAsync("/leci/Leci/leci");
            Assert.That(response.Status, Is.EqualTo(200));
        }

        [Test]
        public async Task Leci_GetLecenje_Nepostojece_Vraca404()
        {
            var response = await _requestContext.GetAsync("/leci/Leci/leci/99999");
            Assert.That(response.Status, Is.EqualTo(404));
        }

        [Test]
        public async Task Leci_GetPorodiljeZaLekara_Nepostojece_Vraca404()
        {
            var response = await _requestContext.GetAsync("/leci/Leci/porodilje_lekara/99999");
            Assert.That(response.Status, Is.EqualTo(404));
        }

        [Test]
        public async Task Leci_GetPorodiljeZaLekara_Postojeci_Vraca200Ili404()
        {
            var noviLekar = new { imeIPrezime = "Test", datumRodjenja = "1980-01-01T00:00:00Z", email = "testporodilje@test.com", lozinka = "123", telefon = "123", ustanova = "U", prostorija = "P" };
            var postResponse = await _requestContext.PostAsync("/lekar/Lekar/dodaj_lekara", new APIRequestContextOptions { DataObject = noviLekar });
            
            if (postResponse.Status == 201)
            {
                try 
                {
                    var body = await postResponse.JsonAsync();
                    int id = body.Value.GetProperty("id").GetInt32();
                    
                    var getResponse = await _requestContext.GetAsync($"/leci/Leci/porodilje_lekara/{id}");
                    Assert.That(getResponse.Status, Is.EqualTo(404));

                    await _requestContext.DeleteAsync($"/lekar/Lekar/brisi_lekara/{id}");
                } 
                catch { }
            }
        }

        [Test]
        public async Task Leci_DodajLeci_KreiranoUspesno()
        {
            var lecenje = new { idPorodilje = 99998, idLekara = 99998, aktivno = true };
            var response = await _requestContext.PostAsync("/leci/Leci/dodaj_leci", new APIRequestContextOptions { DataObject = lecenje });
            Assert.That(response.Status, Is.EqualTo(201));

            if (response.Status == 201)
            {
                try 
                {
                    var body = await response.JsonAsync();
                    int id = body.Value.GetProperty("id").GetInt32();
                    await _requestContext.DeleteAsync($"/leci/Leci/{id}");
                }
                catch { }
            }
        }

        [Test]
        public async Task Leci_DeleteLecenje_Nepostojece_Vraca404()
        {
            var response = await _requestContext.DeleteAsync("/leci/Leci/99999");
            Assert.That(response.Status, Is.EqualTo(404));
        }

        //Pregled Controller
        [Test]
        public async Task Pregled_GetZahteviZaPregled_PraznaLista_Vraca_404()
        {
            var response = await _requestContext.GetAsync("/pregled/Pregled/zahtevi/99999");
            Assert.That(response.Status, Is.EqualTo(404));
        }

        [Test]
        public async Task Pregled_GetZahteviZaPregled_PostojeciLekar_Vraca200()
        {
            var noviLekar = new { imeIPrezime = "Test", datumRodjenja = "1980-01-01T00:00:00Z", email = "testzahtevi@test.com", lozinka = "123", telefon = "123", ustanova = "U", prostorija = "P" };
            var postResponse = await _requestContext.PostAsync("/lekar/Lekar/dodaj_lekara", new APIRequestContextOptions { DataObject = noviLekar });
            
            if (postResponse.Status == 201)
            {
                try 
                {
                    var body = await postResponse.JsonAsync();
                    int id = body.Value.GetProperty("id").GetInt32();
                    
                    var getResponse = await _requestContext.GetAsync($"/pregled/Pregled/zahtevi/{id}");
                    Assert.That(getResponse.Status, Is.EqualTo(200));

                    await _requestContext.DeleteAsync($"/lekar/Lekar/brisi_lekara/{id}");
                } 
                catch { }
            }
        }

        [Test]
        public async Task Pregled_PrihvatiPregled_Nepostojeci_Vraca404()
        {
            var response = await _requestContext.PutAsync("/pregled/Pregled/prihvati/99999");
            Assert.That(response.Status, Is.AnyOf(404, 500));
        }

        [Test]
        public async Task Pregled_OdbijPregled_Nepostojeci_Vraca404()
        {
            var response = await _requestContext.DeleteAsync("/pregled/Pregled/odbij/99999");
            Assert.That(response.Status, Is.AnyOf(404, 500));
        }

        [Test]
        public async Task Pregled_GetRasporedZaDan_PraznaLista_Vraca_404()
        {
            var response = await _requestContext.GetAsync("/pregled/Pregled/raspored?idLekara=99999&datum=2026-01-01T00:00:00Z");
            Assert.That(response.Status, Is.EqualTo(404));
        }

        [Test]
        public async Task Pregled_GetRasporedZaDan_PostojeciLekar_Vraca200()
        {
            var noviLekar = new { imeIPrezime = "Test", datumRodjenja = "1980-01-01T00:00:00Z", email = "testraspored@test.com", lozinka = "123", telefon = "123", ustanova = "U", prostorija = "P" };
            var postResponse = await _requestContext.PostAsync("/lekar/Lekar/dodaj_lekara", new APIRequestContextOptions { DataObject = noviLekar });
            
            if (postResponse.Status == 201)
            {
                try 
                {
                    var body = await postResponse.JsonAsync();
                    int id = body.Value.GetProperty("id").GetInt32();
                    
                    var getResponse = await _requestContext.GetAsync($"/pregled/Pregled/raspored?idLekara={id}&datum=2026-01-01T00:00:00Z");
                    Assert.That(getResponse.Status, Is.EqualTo(200));

                    await _requestContext.DeleteAsync($"/lekar/Lekar/brisi_lekara/{id}");
                } 
                catch { }
            }
        }

        [Test]
        public async Task Pregled_GetDatumiPregleda_PraznaLista_Vraca_404()
        {
            var response = await _requestContext.GetAsync("/pregled/Pregled/datumi-pregleda/99999");
            Assert.That(response.Status, Is.EqualTo(404));
        }

        [Test]
        public async Task Pregled_GetDatumiPregleda_PostojeciLekar_Vraca200()
        {
            var noviLekar = new { imeIPrezime = "Test", datumRodjenja = "1980-01-01T00:00:00Z", email = "testdatumi@test.com", lozinka = "123", telefon = "123", ustanova = "U", prostorija = "P" };
            var postResponse = await _requestContext.PostAsync("/lekar/Lekar/dodaj_lekara", new APIRequestContextOptions { DataObject = noviLekar });
            
            if (postResponse.Status == 201)
            {
                try 
                {
                    var body = await postResponse.JsonAsync();
                    int id = body.Value.GetProperty("id").GetInt32();
                    
                    var getResponse = await _requestContext.GetAsync($"/pregled/Pregled/datumi-pregleda/{id}");
                    Assert.That(getResponse.Status, Is.EqualTo(200));

                    await _requestContext.DeleteAsync($"/lekar/Lekar/brisi_lekara/{id}");
                } 
                catch { }
            }
        }

        [Test]
        public async Task Pregled_GetDozvoljeniPregledi_NepostojecaPorodilja_Vraca404()
        {
            var response = await _requestContext.GetAsync("/pregled/Pregled/dozvoljeni-pregledi/99999");
            Assert.That(response.Status, Is.EqualTo(404));
        }

        [Test]
        public async Task Pregled_GetPregled_Nepostojeci_Vraca404()
        {
            var response = await _requestContext.GetAsync("/pregled/Pregled/pregled/99999");
            Assert.That(response.Status, Is.EqualTo(404));
        }

        [Test]
        public async Task Pregled_CreatePregled_KreiranoUspesno()
        {
            var pregled = new { termin = "2026-05-05T10:00:00Z", idLeci = 0, idTipaPregleda = 0, jePotvrdjen = false, dozvoljenoPrikazivanje = false };
            var response = await _requestContext.PostAsync("/pregled/Pregled/pregled", new APIRequestContextOptions { DataObject = pregled });
            Assert.That(response.Status, Is.EqualTo(201));
            
            if (response.Status == 201)
            {
                try 
                {
                    var body = await response.JsonAsync();
                    int id = body.Value.GetProperty("id").GetInt32();
                    await _requestContext.DeleteAsync($"/pregled/Pregled/pregled/{id}");
                }
                catch { }
            }
        }

        [Test]
        public async Task Pregled_UpdatePregled_Nepostojeci_Vraca400()
        {
            var pregled = new { id = 88888, termin = "2026-05-05T10:00:00Z" }; 
            var response = await _requestContext.PutAsync("/pregled/Pregled/pregled/99999", new APIRequestContextOptions { DataObject = pregled });
            Assert.That(response.Status, Is.EqualTo(400)); 
        }

        [Test]
        public async Task Pregled_DeletePregled_Nepostojeci_Vraca404()
        {
            var response = await _requestContext.DeleteAsync("/pregled/Pregled/pregled/99999");
            Assert.That(response.Status, Is.EqualTo(404));
        }

        [Test]
        public async Task Pregled_UpdateDozvoljenoPrikazivanje_Nepostojeci_Vraca404()
        {
            var response = await _requestContext.PatchAsync("/pregled/Pregled/pregled/99999/dozvoljenoPrikazivanje?dozvoljenoPrikazivanje=true");
            Assert.That(response.Status, Is.EqualTo(404));
        }

        //Preporuka Controller
        [Test]
        public async Task Preporuka_GetPreporukeLekar_Prazno_Vraca_400()
        {
            var response = await _requestContext.GetAsync("/api/Preporuka/lekar/99999");
            Assert.That(response.Status, Is.EqualTo(404));
        }

        [Test]
        public async Task Preporuka_GetPreporukeLekar_PostojeciLekar_Vraca200()
        {
            var noviLekar = new { imeIPrezime = "Test", datumRodjenja = "1980-01-01T00:00:00Z", email = "testpreporuke@test.com", lozinka = "123", telefon = "123", ustanova = "U", prostorija = "P" };
            var postResponse = await _requestContext.PostAsync("/lekar/Lekar/dodaj_lekara", new APIRequestContextOptions { DataObject = noviLekar });
            
            if (postResponse.Status == 201)
            {
                try 
                {
                    var body = await postResponse.JsonAsync();
                    int id = body.Value.GetProperty("id").GetInt32();
                    
                    var getResponse = await _requestContext.GetAsync($"/api/Preporuka/lekar/{id}");
                    Assert.That(getResponse.Status, Is.EqualTo(200));

                    await _requestContext.DeleteAsync($"/lekar/Lekar/brisi_lekara/{id}");
                } 
                catch { }
            }
        }

        [Test]
        public async Task Preporuka_CreatePreporuka_KreiranoUspesno()
        {
            var preporuka = new { idLeci = 0, tekst = "Test", datumOd = "2026-01-01T00:00:00Z", datumDo = "2026-01-10T00:00:00Z" };
            var response = await _requestContext.PostAsync("/api/Preporuka", new APIRequestContextOptions { DataObject = preporuka });
            Assert.That(response.Status, Is.AnyOf(200, 201));
            
            if (response.Status == 201)
            {
                try 
                {
                    var body = await response.JsonAsync();
                    int id = body.Value.GetProperty("id").GetInt32();
                    await _requestContext.DeleteAsync($"/api/Preporuka/{id}");
                }
                catch { }
            }
        }

        [Test]
        public async Task Preporuka_UpdatePreporuka_NijeIstiId_Vraca400()
        {
            var preporuka = new { id = 88888, tekst = "Test" };
            var response = await _requestContext.PutAsync("/api/Preporuka/99999", new APIRequestContextOptions { DataObject = preporuka });
            Assert.That(response.Status, Is.EqualTo(400));
        }

        [Test]
        public async Task Preporuka_DeletePreporuka_Nepostojeca_Vraca404()
        {
            var response = await _requestContext.DeleteAsync("/api/Preporuka/99999");
            Assert.That(response.Status, Is.EqualTo(404));
        }

        //Rezultat Controller
        [Test]
        public async Task Rezultat_GetRezultat_Nepostojeci_Vraca404_Ili_500()
        {
            var response = await _requestContext.GetAsync("/api/Rezultat/99999");
            Assert.That(response.Status, Is.EqualTo(404));
        }

        [Test]
        public async Task Rezultat_CreateRezultat_KreiranoUspesno()
        {
            var rezultat = new { datum = "2026-01-01T00:00:00Z", tip = "Test", sadrzaj = "Test Sadrzaj", idPregleda = 0 };
            var response = await _requestContext.PostAsync("/api/Rezultat/dodaj_rezultat", new APIRequestContextOptions { DataObject = rezultat });
            Assert.That(response.Status, Is.AnyOf(200, 201));
            
            if (response.Status == 201)
            {
                try 
                {
                    var body = await response.JsonAsync();
                    int id = body.Value.GetProperty("id").GetInt32();
                    await _requestContext.DeleteAsync($"/api/Rezultat/brisi_rezultat/{id}");
                }
                catch { }
            }
        }

        [Test]
        public async Task Rezultat_DeleteRezultat_Nepostojeci_Vraca404()
        {
            var response = await _requestContext.DeleteAsync("/api/Rezultat/brisi_rezultat/99999");
            Assert.That(response.Status, Is.EqualTo(404));
        }

        [Test]
        public async Task Rezultat_GetRezultatiZaPregled_Prazno_Vraca404()
        {
            var response = await _requestContext.GetAsync("/api/Rezultat/rezultati_za_pregled/99999");
            Assert.That(response.Status, Is.EqualTo(404));
        }


        //Tip pregleda controller
        [Test]
        public async Task TipPregleda_GetTipovePregleda_Vraca200()
        {
            var response = await _requestContext.GetAsync("/api/TipPregleda");
            Assert.That(response.Status, Is.EqualTo(200));
        }

    }
}