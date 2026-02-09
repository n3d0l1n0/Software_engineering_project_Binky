
export default function Homepage() {

  const container = document.createElement('div');
  container.className = 'min-h-screen bg-gradient-to-br from-pink-200 to-blue-200 flex items-stretch justify-center p-4 md:space-x-8 flex-col md:flex-row';

  //LEVA KARTICA
  const welcomeCard = document.createElement('div');
  welcomeCard.className = 'bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-w-md w-full mb-8 md:mb-0 flex-1 flex flex-col justify-center items-center text-center';

  const welcomeTitle = document.createElement('h2');
  welcomeTitle.className = 'text-4xl font-extrabold mb-4 text-pink-500';
  welcomeTitle.textContent = 'Dobrodošli!';

  const welcomeText = document.createElement('p');
  welcomeText.className = 'text-lg text-gray-800 leading-relaxed font-semibold';
  welcomeText.innerHTML = `
    Ukoliko ste nova porodilja koja još uvek nije registrovana, molimo vas da se registrujete kako biste pristupili svim funkcionalnostima aplikacije.<br><br>
    Ukoliko ste već registrovani, slobodno se prijavite na svoj nalog.<br><br>
    Ukoliko ste pak član kruga porodiljinih bližnjih, unesite njen JMBG kako biste mogli da proverite napredak trudnoće.<br><br>
    Hvala što koristite našu aplikaciju!
  `;

  welcomeCard.appendChild(welcomeTitle);
  welcomeCard.appendChild(welcomeText);
  container.appendChild(welcomeCard);

  //DESNA KARTICA
  const card = document.createElement('div');
  card.className = 'bg-white rounded-3xl shadow-2xl p-6 md:p-8 max-w-md w-full flex-1 flex flex-col justify-center items-center text-center';
  
  const logoTekst = document.createElement('h1');
  logoTekst.className = 'text-5xl font-extrabold text-pink-500 mb-8 tracking-wider';
  logoTekst.textContent = 'BINKY';
  
  const logoDiv = document.createElement('div');
  logoDiv.className = 'mb-8';

  const logo = document.createElement('div');
  logo.className ='w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 mx-auto rounded-full overflow-hidden shadow-lg bg-white flex items-center justify-center';

  const img = document.createElement('img');
  img.src = './assets/cucla.png';       
  img.alt = 'Logo';
  img.className = 'w-full h-full object-scale-down'; 

  logo.appendChild(img);
  logoDiv.appendChild(logo);
  
  const buttonsDiv = document.createElement('div');
  buttonsDiv.className = 'space-y-4';
  
  const loginBtn = document.createElement('button');
  loginBtn.className = 'w-full bg-pink-400 hover:bg-pink-500 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-md';
  loginBtn.textContent = 'Prijavi se';
  loginBtn.setAttribute('data-action', 'login');
  
  const registerBtn = document.createElement('button');
  registerBtn.className = 'w-full bg-pink-400 hover:bg-pink-500 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-md';
  registerBtn.textContent = 'Registruj se';
  registerBtn.setAttribute('data-action', 'register');
  
  const searchBtn = document.createElement('button');
  searchBtn.className = 'w-full bg-pink-400 hover:bg-pink-500 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 shadow-md';
  searchBtn.textContent = 'Pretraga';
  searchBtn.setAttribute('data-action', 'search');

  buttonsDiv.appendChild(loginBtn);
  buttonsDiv.appendChild(registerBtn);
  buttonsDiv.appendChild(searchBtn);
  
  card.appendChild(logoTekst);
  card.appendChild(logoDiv);
  card.appendChild(buttonsDiv);
  container.appendChild(card);
  
  return container;
}
