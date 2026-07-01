import { PrismaClient, TipoSala } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // =========================
  // ÉPOCAS
  // =========================

  await prisma.epoca.createMany({
    data: [
      {
        id: 1,
        nombre: "1990-1999",
      },
      {
        id: 2,
        nombre: "2000-2009",
      },
    ],
    skipDuplicates: true,
  });

  // =========================
  // TEMÁTICAS
  // =========================

  await prisma.tematica.createMany({
    data: [
      {
        id: 1,
        epocaId: 1,
        nombre: "Fiesta",
        descripcion:
          "Revive las noches de fiesta de los años 90 con horarios programados de fin de semana.",
      },
      {
        id: 2,
        epocaId: 1,
        nombre: "Tropical",
        descripcion:
          "Ambiente veraniego de los años 90, inspirado en vacaciones y playa.",
      },
      {
        id: 3,
        epocaId: 1,
        nombre: "Navidad",
        descripcion:
          "Celebración navideña ambientada en los años 90.",
      },
      {
        id: 4,
        epocaId: 1,
        nombre: "TV Shows",
        descripcion:
          "Series, programas y televisión de los años 90.",
      },
      {
        id: 5,
        epocaId: 2,
        nombre: "Fiesta",
        descripcion:
          "Revive las noches de fiesta de los años 2000 con horarios programados de fin de semana.",
      },
      {
        id: 6,
        epocaId: 2,
        nombre: "Tropical",
        descripcion:
          "Ambiente veraniego de los años 2000, inspirado en vacaciones y playa.",
      },
      {
        id: 7,
        epocaId: 2,
        nombre: "Navidad",
        descripcion:
          "Celebración navideña ambientada en los años 2000.",
      },
      {
        id: 8,
        epocaId: 2,
        nombre: "TV Shows",
        descripcion:
          "Series, programas y televisión de los años 2000.",
      },
    ],
    skipDuplicates: true,
  });

  // =========================
  // SALAS
  // =========================

  await prisma.sala.createMany({
    data: [

      {
        id: 1,
        tipo: TipoSala.general_anual,
        ano: 1990,
        epocaId: 1,
        tematicaId: null,
        nombre: "1990",
        descripcion:
          "Chat del año 1990. Flores marchitas y tonos sépia. Estética grunge underground, texturas de papel y tipografía Twin Peaks.",
        cerrada: false,
      },

      {
        id: 2,
        tipo: TipoSala.general_anual,
        ano: 1991,
        epocaId: 1,
        tematicaId: null,
        nombre: "1991",
        descripcion:
          "Chat del año 1991. Neón urbano y ciberpunk sucio. Ciudad nocturna con lluvia, neones rosas y azules.",
        cerrada: false,
      },

      {
        id: 3,
        tipo: TipoSala.general_anual,
        ano: 1992,
        epocaId: 1,
        tematicaId: null,
        nombre: "1992",
        descripcion:
          "Chat del año 1992. Rave analógico con smileys ácidos, colores fluorescentes y fondos negros que vibran.",
        cerrada: false,
      },

      {
        id: 4,
        tipo: TipoSala.general_anual,
        ano: 1993,
        epocaId: 1,
        tematicaId: null,
        nombre: "1993",
        descripcion:
          "Chat del año 1993. Darkwave elegante. Humo, mármol y tipografía gótica. La sala más oscura y seria.",
        cerrada: false,
      },

      {
        id: 5,
        tipo: TipoSala.general_anual,
        ano: 1994,
        epocaId: 1,
        tematicaId: null,
        nombre: "1994",
        descripcion:
          "Chat del año 1994. Pop maximalista de Friends. Rojo, amarillo y azul primario con ondas y cuadros.",
        cerrada: false,
      },

      {
        id: 6,
        tipo: TipoSala.general_anual,
        ano: 1995,
        epocaId: 1,
        tematicaId: null,
        nombre: "1995",
        descripcion:
          "Chat del año 1995. Eurodance galáctico. Estrellas, lunas, plateados y pista de baile espacial.",
        cerrada: false,
      },

      {
        id: 7,
        tipo: TipoSala.general_anual,
        ano: 1996,
        epocaId: 1,
        tematicaId: null,
        nombre: "1996",
        descripcion:
          "Chat del año 1996. MTV Golden Age. Videoclips de los 90, colores saturados, garaje industrial, skate y pop-punk.",
        cerrada: false,
      },

      {
        id: 8,
        tipo: TipoSala.general_anual,
        ano: 1997,
        epocaId: 1,
        tematicaId: null,
        nombre: "1997",
        descripcion:
          "Chat del año 1997. Televisión y Cultura Pop. Sitcoms, tazas de café, colores marrones y naranjas. La esencia noventera.",
        cerrada: false,
      },

      {
        id: 9,
        tipo: TipoSala.general_anual,
        ano: 1998,
        epocaId: 1,
        tematicaId: null,
        nombre: "1998",
        descripcion:
          "Chat del año 1998. Cyberdelia de Matrix. Verde neón sobre negro con líneas de código de fondo.",
        cerrada: false,
      },

      {
        id: 10,
        tipo: TipoSala.general_anual,
        ano: 1999,
        epocaId: 1,
        tematicaId: null,
        nombre: "1999",
        descripcion:
          "Chat del año 1999. Boyband Mania. Azul plateado, blanco brillante y la fiebre del pop adolescente.",
        cerrada: false,
      },
            {
        id: 11,
        tipo: TipoSala.general_anual,
        ano: 2000,
        epocaId: 2,
        tematicaId: null,
        nombre: "2000",
        descripcion:
          "Chat del año 2000. Bubblegum Pop de Britney. Rosa chicle, azul cielo, purpurina y tipografía redondeada.",
        cerrada: false,
      },

      {
        id: 12,
        tipo: TipoSala.general_anual,
        ano: 2001,
        epocaId: 2,
        tematicaId: null,
        nombre: "2001",
        descripcion:
          "Chat del año 2001. Nu-Metal tribal de Linkin Park. Grises y naranjas quemados con fuentes de grafiti.",
        cerrada: false,
      },

      {
        id: 13,
        tipo: TipoSala.general_anual,
        ano: 2002,
        epocaId: 2,
        tematicaId: null,
        nombre: "2002",
        descripcion:
          "Chat del año 2002. Hip-Hop Bling Bling de Eminem. Dorado, negro y blanco con cadenas y brillos.",
        cerrada: false,
      },

      {
        id: 14,
        tipo: TipoSala.general_anual,
        ano: 2003,
        epocaId: 2,
        tematicaId: null,
        nombre: "2003",
        descripcion:
          "Chat del año 2003. Emo Clásico de My Chemical Romance. Negro, rojo oscuro.",
        cerrada: false,
      },

      {
        id: 15,
        tipo: TipoSala.general_anual,
        ano: 2004,
        epocaId: 2,
        tematicaId: null,
        nombre: "2004",
        descripcion:
          "Chat del año 2004. MSN Messenger y Fotolog. Ventanas de chat, burbujas de texto, emoticonos y la era dorada del Internet social.",
        cerrada: false,
      },

      {
        id: 16,
        tipo: TipoSala.general_anual,
        ano: 2005,
        epocaId: 2,
        tematicaId: null,
        nombre: "2005",
        descripcion:
          "Chat del año 2005. MySpace Scene caótico. Texturas feas, fuentes ilegibles y neón sobre negro.",
        cerrada: false,
      },

      {
        id: 17,
        tipo: TipoSala.general_anual,
        ano: 2006,
        epocaId: 2,
        tematicaId: null,
        nombre: "2006",
        descripcion:
          "Chat del año 2006. Scene Extrema Kawaii. Negro con arcoíris, rayas de tigre y corazones rotos.",
        cerrada: false,
      },

      {
        id: 18,
        tipo: TipoSala.general_anual,
        ano: 2007,
        epocaId: 2,
        tematicaId: null,
        nombre: "2007",
        descripcion:
          "Chat del año 2007. Frutiger Aero de Windows Vista. Vidrio, burbujas, brillos y paisajes con peces.",
        cerrada: false,
      },

      {
        id: 19,
        tipo: TipoSala.general_anual,
        ano: 2008,
        epocaId: 2,
        tematicaId: null,
        nombre: "2008",
        descripcion:
          "Chat del año 2008. Electro House / Bloghouse. Neones verdes y morados, vinilos, Justice y sintetizadores.",
        cerrada: false,
      },

      {
        id: 20,
        tipo: TipoSala.general_anual,
        ano: 2009,
        epocaId: 2,
        tematicaId: null,
        nombre: "2009",
        descripcion:
          "Chat del año 2009. Cyberpunk Revival. Avatar y smartphones. Azul eléctrico, naranja, circuitos y hologramas.",
        cerrada: false,
      },
            {
        id: 21,
        tipo: TipoSala.epoca_estilo,
        ano: null,
        epocaId: 1,
        tematicaId: 1,
        nombre: "Fiesta 90s",
        descripcion:
          "Revive las noches de fiesta de los años 90. Disponible viernes y sábados de 22:00 a 05:30.",
        cerrada: true,
      },

      {
        id: 22,
        tipo: TipoSala.epoca_estilo,
        ano: null,
        epocaId: 1,
        tematicaId: 2,
        nombre: "Tropical 90s",
        descripcion:
          "Ambiente veraniego de los años 90, inspirado en vacaciones y playa. Disponible del 21 de junio al 31 de agosto.",
        cerrada: false,
      },

      {
        id: 23,
        tipo: TipoSala.epoca_estilo,
        ano: null,
        epocaId: 1,
        tematicaId: 3,
        nombre: "Navidad 90s",
        descripcion:
          "Celebración navideña ambientada en los años 90. Disponible del 20 de diciembre al 6 de enero.",
        cerrada: true,
      },

      {
        id: 24,
        tipo: TipoSala.epoca_estilo,
        ano: null,
        epocaId: 1,
        tematicaId: 4,
        nombre: "TV Shows 90s",
        descripcion:
          "Sala dedicada a series y programas de televisión de los años 90. La emisión está activa de 19:00 a 03:00. De 03:00 a 05:30 se activa programación nocturna (teletienda y contenidos alternativos). Fuera de ese horario la sala permanece con emisión en pausa.",
        cerrada: false,
      },

      {
        id: 25,
        tipo: TipoSala.epoca_estilo,
        ano: null,
        epocaId: 2,
        tematicaId: 5,
        nombre: "Fiesta 2000s",
        descripcion:
          "Revive las noches de fiesta de los años 2000. Disponible viernes y sábados de 22:00 a 05:30.",
        cerrada: true,
      },

      {
        id: 26,
        tipo: TipoSala.epoca_estilo,
        ano: null,
        epocaId: 2,
        tematicaId: 6,
        nombre: "Tropical 2000s",
        descripcion:
          "Ambiente veraniego de los años 2000, inspirado en vacaciones y playa. Disponible del 21 de junio al 31 de agosto.",
        cerrada: false,
      },

      {
        id: 27,
        tipo: TipoSala.epoca_estilo,
        ano: null,
        epocaId: 2,
        tematicaId: 7,
        nombre: "Navidad 2000s",
        descripcion:
          "Celebración navideña ambientada en los años 2000. Disponible del 20 de diciembre al 6 de enero.",
        cerrada: true,
      },

      {
        id: 28,
        tipo: TipoSala.epoca_estilo,
        ano: null,
        epocaId: 2,
        tematicaId: 8,
        nombre: "TV Shows 2000s",
        descripcion:
          "Sala dedicada a series y programas de televisión de los años 2000. La emisión está activa de 19:00 a 03:00. De 03:00 a 05:30 se activa programación nocturna (teletienda y contenidos alternativos). Fuera de ese horario la sala permanece con emisión en pausa.",
        cerrada: false,
      },
    ],
    skipDuplicates: true,
  });

  console.log("✅ Datos iniciales insertados correctamente.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });