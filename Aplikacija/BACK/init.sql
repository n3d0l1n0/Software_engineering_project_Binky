CREATE TABLE Lekar(
	ID serial PRIMARY KEY,
	ImeIPrezime varchar(50) NOT NULL,
	DatumRodjenja DATE NOT NULL,
	Email varchar(50) NOT NULL,
	Lozinka varchar(255) NOT NULL,
	Telefon varchar(15) NOT NULL,
	ProfilnaSlika varchar(255),
	Ustanova varchar(50) NOT NULL,
	Prostorija varchar(50) NOT NULL
);

CREATE TABLE Porodilja(
	ID SERIAL PRIMARY KEY,
	ImeIPrezime VARCHAR(50) NOT NULL,
	DatumRodjenja DATE NOT NULL,
	Email VARCHAR(50) NOT NULL,
	Lozinka VARCHAR(255) NOT NULL,
	Telefon VARCHAR(15) NOT NULL,
	JMBG varchar(255) UNIQUE NOT NULL,
	LBO varchar(15) UNIQUE NOT NULL,
	PocetakTrudnoce date NOT NULL,
	SePorodila BOOLEAN NOT NULL DEFAULT FALSE
);

ALTER TABLE Porodilja
DROP COLUMN DozvoljenoPrikazivanje;

ALTER TABLE Pregled
ADD COLUMN DozvoljenoPrikazivanje BOOLEAN DEFAULT FALSE;

ALTER TABLE Porodilja
ADD ProfilnaSlika VARCHAR(255);

CREATE TABLE Leci(
	ID serial PRIMARY KEY,
	IDPorodilje integer NOT NULL,
	IDLekara integer NOT NULL,
	Aktivno boolean NOT NULL DEFAULT TRUE
);

CREATE TABLE Pregled(
	ID serial PRIMARY KEY,
	Termin timestamp NOT NULL,
	IDLeci integer NOT NULL,
	IDTipaPregleda integer NOT NULL,
	JePotvrdjen boolean NOT NULL DEFAULT FALSE
);

CREATE TABLE TipPregleda(
	ID serial PRIMARY KEY,
	Naziv varchar(50) NOT NULL,
	VremeTrajanja integer NOT NULL
);

CREATE TABLE Rezultat(
	ID serial PRIMARY KEY,
	Datum date NOT NULL,
	Tip rezultatenum NOT NULL,
	Sadrzaj varchar(255) NOT NULL,
	IDPregleda integer NOT NULL
);

ALTER TABLE Rezultat
DROP COLUMN Tip;

ALTER TABLE rezultat
ADD COLUMN tip VARCHAR(50)
    CHECK (tip IN (
        'Krvna slika',
        'Biohemija',
        'Ultrazvuk',
        'Urinokultura',
        'Nalaz sa infektologije',
        'Prenatalni test'
    ));


CREATE TABLE Preporuka(
	ID serial PRIMARY KEY,
	IDLeci integer NOT NULL,
	Tekst text NOT NULL,
	DatumOd date NOT NULL,
	DatumDo date NOT NULL
);

INSERT INTO tippregleda (naziv, vremetrajanja)
VALUES ('Redovni pregled',30);

INSERT INTO tippregleda (naziv, vremetrajanja)
VALUES ('Konsultacija', 15);

INSERT INTO tippregleda (naziv, vremetrajanja)
VALUES ('Kontrola', 30);

INSERT INTO tippregleda (naziv, vremetrajanja)
VALUES ('Ultrazvuk', 60);

INSERT INTO tippregleda (naziv, vremetrajanja)
VALUES ('Laboratorijski pregled', 30);

INSERT INTO tippregleda (naziv, vremetrajanja)
VALUES ('Ostalo', 30);