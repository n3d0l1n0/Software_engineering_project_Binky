using System.Threading.Tasks;
using Microsoft.Playwright;
using NUnit.Framework;
using static Microsoft.Playwright.Assertions;

namespace PlaywrightTests
{
    public class EndToEndTests
    {
        private IPlaywright _playwright;
        private IBrowser _browser;
        private IPage _page;

        [SetUp]
        public async Task Setup()
        {
            _playwright = await Playwright.CreateAsync();
            
            _browser = await _playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions 
            { 
                Headless = false, 
                SlowMo = 1500 
            });
            
            _page = await _browser.NewPageAsync();
        }

        [TearDown]
        public async Task TearDown()
        {
            await _page.CloseAsync();
            await _browser.CloseAsync();
            _playwright.Dispose();
        }


        //Login 
        [Test]
        public async Task Frontend_PrikazujeSeLoginForma_SaSvimElementima()
        {
            await _page.GotoAsync("http://127.0.0.1:5501/#/login");
            await Expect(_page.Locator("h2:has-text('Prijava')")).ToBeVisibleAsync();
            await Expect(_page.Locator("#email")).ToBeVisibleAsync();
            await Expect(_page.Locator("#password")).ToBeVisibleAsync();
            await Expect(_page.Locator("#lekar")).ToBeVisibleAsync(); 
            await Expect(_page.Locator("#porodilja")).ToBeVisibleAsync(); 
            await Expect(_page.Locator("button.PrijavaButton")).ToBeVisibleAsync();
        }

        [Test]
        public async Task Frontend_UspesanLoginLekara_VodiNaDashboard()
        {
            await _page.GotoAsync("http://127.0.0.1:5501/#/login");
            await _page.CheckAsync("#lekar");
            await _page.FillAsync("#email", "milan.petrovic@bolnica.rs");
            await _page.FillAsync("#password", "lozinka123");
            await _page.ClickAsync("button.PrijavaButton");
            await _page.WaitForURLAsync("**/#/doktor-dashboard", new PageWaitForURLOptions
            {
                Timeout = 5000 
            });
            Assert.That(_page.Url, Does.Contain("#/doktor-dashboard"), "Korisnik bi trebalo da bude preusmeren na doktor dashboard nakon uspešne prijave.");
        }

        [Test]
        public async Task Frontend_KlikNaNazad_VodiNaPocetnuStranu()
        {
            await _page.GotoAsync("http://127.0.0.1:5501/#/login");
            await _page.ClickAsync("button:has-text('Nazad na početnu stranu')");
            await _page.WaitForURLAsync("**/#/", new PageWaitForURLOptions { Timeout = 3000 });
            Assert.That(_page.Url, Does.Not.Contain("login"));
        }

        [Test]
        public async Task Frontend_UspesanLoginI_Odjava_VodiNazadNaPocetnu()
        {
            await _page.GotoAsync("http://127.0.0.1:5501/#/login");
            await _page.CheckAsync("#lekar");
            await _page.FillAsync("#email", "milan.petrovic@bolnica.rs");
            await _page.FillAsync("#password", "lozinka123");

            await _page.ClickAsync("button.PrijavaButton");
            await _page.WaitForURLAsync("**/#/doktor-dashboard", new PageWaitForURLOptions { Timeout = 5000 });
            await Expect(_page).ToHaveURLAsync(new System.Text.RegularExpressions.Regex(".*/#/doktor-dashboard"));

            await _page.ClickAsync(".odjaviSeButton");
            await _page.WaitForURLAsync("**/#/", new PageWaitForURLOptions { Timeout = 5000 });
            Assert.That(_page.Url, Is.EqualTo("http://127.0.0.1:5501/#/"));
            await Expect(_page.Locator("button[data-action='login']")).ToBeVisibleAsync();
        }
        
        //Lista pacijentkinja 
        [Test]
        public async Task Frontend_Pacijentkinje_VidiRezultatePregleda()
        {
            await _page.GotoAsync("http://127.0.0.1:5501/#/login");
            await _page.CheckAsync("#lekar");
            await _page.FillAsync("#email", "milan.petrovic@bolnica.rs");
            await _page.FillAsync("#password", "lozinka123");
            await _page.ClickAsync("button.PrijavaButton");
            await _page.WaitForURLAsync("**/#/doktor-dashboard");

            await _page.ClickAsync("nav >> text=Lista pacijentkinja");
            await Task.Delay(1500);

            var prvaPacijentkinja = _page.Locator("ul.space-y-4 >> li").First;
            await prvaPacijentkinja.ClickAsync();
            await Task.Delay(1000);

            var modalContent = _page.Locator(".overflow-y-auto").First;
            var rezultatiBtn = _page.Locator("button:has-text('Dodaj/Vidi rezultate')").First;

            await rezultatiBtn.ScrollIntoViewIfNeededAsync();
            await Task.Delay(1000); 

            await rezultatiBtn.ClickAsync();
            await Task.Delay(500);

            await Expect(_page.Locator("h4:has-text('Postojeći rezultati')")).ToBeVisibleAsync();
            
            await _page.ClickAsync("button:has-text('Zatvori')");
        }

        [Test]
        public async Task Frontend_Pacijentkinje_DodajNoviRezultat() //!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
        {
            await _page.GotoAsync("http://127.0.0.1:5501/#/login");
            await _page.CheckAsync("#lekar");
            await _page.FillAsync("#email", "milan.petrovic@bolnica.rs");
            await _page.FillAsync("#password", "lozinka123");
            await _page.ClickAsync("button.PrijavaButton");
            await _page.WaitForURLAsync("**/#/doktor-dashboard");

            await _page.ClickAsync("nav >> text=Lista pacijentkinja");
            await Task.Delay(1500);

            await _page.Locator("ul.space-y-4 >> li").First.ClickAsync();
            await Task.Delay(1000);

            var rezultatiBtn = _page.Locator("button:has-text('Dodaj/Vidi rezultate')").First;
            await rezultatiBtn.ScrollIntoViewIfNeededAsync();
            await rezultatiBtn.ClickAsync();
            await Task.Delay(1000);

            await _page.SelectOptionAsync("select", "2");

            string putanjaDoFajla = @"C:\Users\nstoj\Desktop\test_rezultat.txt"; //!!!!!!!!!!!!!!!!!!!!!!!!!
            
            await _page.SetInputFilesAsync("input[type='file']", putanjaDoFajla);
            await Task.Delay(1000);

            _page.Dialog += async (_, d) => await d.AcceptAsync();

            _page.Dialog += async (_, d) => await d.AcceptAsync();

            await _page.ClickAsync("button:has-text('Sačuvaj rezultat')");

            await Task.Delay(5000);

            string dan = DateTime.Now.Day.ToString() + "."; 
            var noviRezultatLink = _page.Locator("a").Filter(new() { HasText = "Rezultat od" }).Filter(new() { HasText = dan }).Last;
            
            await noviRezultatLink.WaitForAsync(new LocatorWaitForOptions { State = WaitForSelectorState.Visible, Timeout = 10000 });
            await Expect(noviRezultatLink).ToBeVisibleAsync();
            
            Console.WriteLine("Uspešno pronađen novi rezultat na listi!");
            await _page.ClickAsync("button:has-text('Zatvori')");
        }

        [Test]
        public async Task Frontend_Pacijentkinje_CekirajStatusPorodilaSe()
        {
            await _page.GotoAsync("http://127.0.0.1:5501/#/login");
            await _page.CheckAsync("#lekar");
            await _page.FillAsync("#email", "milan.petrovic@bolnica.rs");
            await _page.FillAsync("#password", "lozinka123");
            await _page.ClickAsync("button.PrijavaButton");

            await _page.ClickAsync("nav >> text=Lista pacijentkinja");
            await Task.Delay(1500);

            await _page.Locator("ul.space-y-4 >> li").First.ClickAsync();
            await Task.Delay(1000);

            var checkbox = _page.Locator("#sePorodilaCheckbox");
            
            if (!await checkbox.IsCheckedAsync())
            {
                await checkbox.ScrollIntoViewIfNeededAsync();
                await Task.Delay(500);
                await checkbox.CheckAsync();
            }

            _page.Dialog += async (_, d) => await d.AcceptAsync();

            await _page.ClickAsync("button:has-text('Sačuvaj izmene')");

            await Task.Delay(2000);
            await Expect(_page.Locator("text=Detalji pacijentkinje")).Not.ToBeVisibleAsync();
        }

        //Preporuke 
        [Test]
        public async Task Frontend_Preporuke_KompletanTok_DodajIzmeniObrisi()
        {
            await _page.GotoAsync("http://127.0.0.1:5501/#/login");
            await _page.CheckAsync("#lekar");
            await _page.FillAsync("#email", "milan.petrovic@bolnica.rs");
            await _page.FillAsync("#password", "lozinka123");
            await _page.ClickAsync("button.PrijavaButton");
            await _page.WaitForURLAsync("**/#/doktor-dashboard");

            await _page.ClickAsync("nav >> text=Preporuke");
            await Task.Delay(1000);

            string unikatniTekst = "Voda_Test_" + Guid.NewGuid().ToString().Substring(0, 5);
            
            void HandleAlert(object sender, IDialog dialog) => dialog.AcceptAsync();
            _page.Dialog += HandleAlert;

            await _page.ClickAsync("button:has-text('Dodaj novu preporuku')");
            await _page.SelectOptionAsync("#leciId", new[] { new SelectOptionValue { Index = 0 } });
            await _page.FillAsync("#tekst", unikatniTekst);
            await _page.FillAsync("#datumOd", "2026-03-01");
            await _page.FillAsync("#datumDo", "2026-03-10");
            
            await _page.ClickAsync("button:has-text('Sačuvaj')");
            await Task.Delay(2000);

            var redPreporuke = _page.Locator("div.p-4").Filter(new() { HasText = unikatniTekst });
            
            await redPreporuke.ScrollIntoViewIfNeededAsync();
            await redPreporuke.GetByRole(AriaRole.Button, new() { Name = "Izmeni" }).ClickAsync();

            string izmenjenTekst = unikatniTekst + "_EDIT";
            await _page.FillAsync("#tekst", izmenjenTekst);
            await _page.ClickAsync("button:has-text('Sačuvaj')");
            
            await Task.Delay(2000);

            var izmenjenRed = _page.Locator("div.p-4").Filter(new() { HasText = izmenjenTekst });
            
            _page.Dialog -= HandleAlert;
            _page.Dialog += async (_, dialog) => {
                await dialog.AcceptAsync(); 
            };

            await izmenjenRed.GetByRole(AriaRole.Button, new() { Name = "Obriši" }).ClickAsync();
            
            await Task.Delay(2000);

            var count = await _page.Locator($"text={izmenjenTekst}").CountAsync();
            Assert.That(count, Is.EqualTo(0), "Preporuka nije obrisana sa ekrana!");
        }

        //Pregledi
        [Test]
        public async Task Frontend_Pregledi_PrihvatiPrviZahtev_Uspesno()
        {
            await _page.GotoAsync("http://127.0.0.1:5501/#/login");
            await _page.CheckAsync("#lekar");
            await _page.FillAsync("#email", "milan.petrovic@bolnica.rs");
            await _page.FillAsync("#password", "lozinka123");
            await _page.ClickAsync("button.PrijavaButton");

            await _page.WaitForURLAsync("**/#/doktor-dashboard");
            await Task.Delay(1000);

            await _page.ClickAsync("nav >> text=Pregledi");
            await Task.Delay(1500);

            var zahteviList = _page.Locator("ul:has-text('Novi zahtevi za pregled')");
            var prviPrihvatiBtn = _page.Locator("button:has-text('Prihvati')").First;

            if (await prviPrihvatiBtn.IsVisibleAsync())
            {
                _page.Dialog += async (_, dialog) => {
                    Assert.That(dialog.Message, Does.Contain("uspešno prihvaćen"));
                    await dialog.AcceptAsync();
                };

                await prviPrihvatiBtn.ScrollIntoViewIfNeededAsync();
                await Task.Delay(1000); 
                await prviPrihvatiBtn.ClickAsync();
                await Task.Delay(2000);
                
                await Expect(_page.Locator("h2:has-text('Upravljanje pregledima')")).ToBeVisibleAsync();
            }
            else
            {
                await Expect(_page.Locator("text=Trenutno nema novih zahteva")).ToBeVisibleAsync();
                Console.WriteLine("Nema zahteva za prihvatanje u ovom trenutku.");
            }
        }


        [Test]
        public async Task Frontend_Pregledi_OdbijanjeZahteva_SaPotvrdom()
        {
            await _page.GotoAsync("http://127.0.0.1:5501/#/login");
            await _page.CheckAsync("#lekar");
            await _page.FillAsync("#email", "milan.petrovic@bolnica.rs");
            await _page.FillAsync("#password", "lozinka123");
            await _page.ClickAsync("button.PrijavaButton");
            await _page.ClickAsync("nav >> text=Pregledi");
            await Task.Delay(1500);

            var prviOdbijBtn = _page.Locator("button:has-text('Odbij')").First;

            if (await prviOdbijBtn.IsVisibleAsync())
            {
                _page.Dialog += async (_, dialog) => {
                    await dialog.AcceptAsync();
                };

                await prviOdbijBtn.ClickAsync();
                await Task.Delay(2000);
                                
                Assert.That(_page.Url, Does.Contain("#/doktor-dashboard"));
            }
        }

        //Raspored pregleda
        [Test]
        public async Task Frontend_Pregledi_PrihvatiIBuduURasporedu_FullFlow()
        {
            await _page.GotoAsync("http://127.0.0.1:5501/#/login");
            await _page.CheckAsync("#lekar");
            await _page.FillAsync("#email", "milan.petrovic@bolnica.rs");
            await _page.FillAsync("#password", "lozinka123");
            await _page.ClickAsync("button.PrijavaButton");
            await _page.WaitForURLAsync("**/#/doktor-dashboard");

            await _page.ClickAsync("nav >> text=Pregledi");
            var dugmePrihvati = _page.Locator("button:has-text('Prihvati')").First;
            
            try 
            {
                await dugmePrihvati.WaitForAsync(new LocatorWaitForOptions { State = WaitForSelectorState.Visible, Timeout = 10000 });
            }
            catch 
            {
                Assert.Ignore("Nema dostupnih zahteva za obradu (Time-out: lista je ostala prazna).");
            }

            var prviZahtevItem = _page.Locator("li:has(button:has-text('Prihvati'))").First;

            string punTerminText = await prviZahtevItem.Locator("p.text-sm").TextContentAsync();
            var match = System.Text.RegularExpressions.Regex.Match(punTerminText, @"(\d{1,2})\.");
            string danZaKalendar = "";
            
            if (match.Success)
            {
                danZaKalendar = match.Groups[1].Value.TrimStart('0'); 
            }
            else 
            {
                Assert.Fail($"Nisam uspeo da izvučem dan iz teksta: {punTerminText}");
            }

            Console.WriteLine($"Pokušavam da kliknem na dan: {danZaKalendar}");

            _page.Dialog += async (_, dialog) => await dialog.AcceptAsync();
            await dugmePrihvati.ClickAsync();
            await Task.Delay(2500);

            await _page.ClickAsync("nav >> text=Raspored pregleda");
            await _page.WaitForSelectorAsync(".grid-cols-7");
            await Task.Delay(2000); 

            var celijaUKalendaru = _page.Locator(".grid-cols-7 div").GetByText(danZaKalendar, new() { Exact = true }).First;
            
            await celijaUKalendaru.ScrollIntoViewIfNeededAsync();
            await Task.Delay(1000);
            await celijaUKalendaru.ClickAsync();

            await Task.Delay(2000);
            var naslovRasporeda = _page.Locator("h3:has-text('Raspored za')");
            await Expect(naslovRasporeda).ToContainTextAsync(danZaKalendar);
            
            var stavkaURasporedu = _page.Locator("ul >> li").First;
            await Expect(stavkaURasporedu).ToBeVisibleAsync();
        }
        
        //Profil 
        [Test]
        public async Task Frontend_Profil_KompletnaPromenaLozinke_U_Modalu()
        {
            await _page.GotoAsync("http://127.0.0.1:5501/#/login");
            await _page.CheckAsync("#lekar");
            await _page.FillAsync("#email", "milan.petrovic@bolnica.rs");
            await _page.FillAsync("#password", "lozinka123");
            await _page.ClickAsync("button.PrijavaButton");

            await _page.WaitForURLAsync("**/#/doktor-dashboard");
            await Task.Delay(1000);

            await _page.ClickAsync("nav >> text=Korisnički profil");
            await Task.Delay(1500);

            var otvoriModalBtn = _page.Locator("button:has-text('Promena lozinke')");
            await otvoriModalBtn.ClickAsync();
            await Task.Delay(1000); 

            await _page.FillAsync("#oldPassword", "lozinka123");
            await _page.FillAsync("#newPassword", "123");
            await _page.FillAsync("#confirmPassword", "123");
            
            await Task.Delay(1000);

            _page.Dialog += async (_, dialog) => await dialog.AcceptAsync();

            var sacuvajBtn = _page.Locator("form >> button:has-text('Sačuvaj novu lozinku')");
            await sacuvajBtn.ClickAsync();

            await Task.Delay(2000);

            var modalCount = await _page.Locator("text='Promena lozinke'").CountAsync();
            Assert.That(_page.Url, Does.Contain("#/doktor-dashboard"));
        }
    }
}