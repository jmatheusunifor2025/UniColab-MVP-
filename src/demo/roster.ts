export interface ListedPerson {
  id: number;
  email: string;
  name: string;
  role: 'student' | 'teacher' | 'coordinator';
  course: string;
  specialty?: string;
  enrollment: string;
  verificationCode: string;
}

export const LISTED_PEOPLE: ListedPerson[] = [
  {
    id: 1,
    email: 'ana.costa@edu.unifor.br',
    name: 'Ana Costa',
    role: 'student',
    course: 'Análise e Desenvolvimento de Sistemas',
    enrollment: '20241001',
    verificationCode: 'K7P2MQ',
  },
  {
    id: 2,
    email: 'bruno.lima@edu.unifor.br',
    name: 'Bruno Lima',
    role: 'student',
    course: 'Ciência da Computação',
    enrollment: '20241018',
    verificationCode: 'R4N8WL',
  },
  {
    id: 3,
    email: 'carla.mendes@edu.unifor.br',
    name: 'Carla Mendes',
    role: 'student',
    course: 'Engenharia da Computação',
    enrollment: '20241102',
    verificationCode: 'Q3H6VT',
  },
  {
    id: 8,
    email: 'diego.almeida@edu.unifor.br',
    name: 'Diego Almeida',
    role: 'student',
    course: 'Análise e Desenvolvimento de Sistemas',
    enrollment: '20241044',
    verificationCode: 'D4S8QA',
  },
  {
    id: 9,
    email: 'elisa.nogueira@edu.unifor.br',
    name: 'Elisa Nogueira',
    role: 'student',
    course: 'Ciência da Computação',
    enrollment: '20241062',
    verificationCode: 'E9R2HK',
  },
  {
    id: 10,
    email: 'felipe.barros@edu.unifor.br',
    name: 'Felipe Barros',
    role: 'student',
    course: 'Engenharia da Computação',
    enrollment: '20241133',
    verificationCode: 'F3B7LN',
  },
  {
    id: 4,
    email: 'helena.duarte@edu.unifor.br',
    name: 'Helena Duarte',
    role: 'teacher',
    course: 'Análise e Desenvolvimento de Sistemas',
    specialty: 'Engenharia de Software',
    enrollment: 'CNDB-18421',
    verificationCode: 'M2C9PX',
  },
  {
    id: 5,
    email: 'ricardo.nunes@edu.unifor.br',
    name: 'Ricardo Nunes',
    role: 'teacher',
    course: 'Ciência da Computação',
    specialty: 'Inteligência Artificial',
    enrollment: 'CNDB-19077',
    verificationCode: 'N5B1YK',
  },
  {
    id: 6,
    email: 'marina.alves@edu.unifor.br',
    name: 'Marina Alves',
    role: 'teacher',
    course: 'Engenharia da Computação',
    specialty: 'Arquitetura de Computadores',
    enrollment: 'CNDB-20315',
    verificationCode: 'T8D4JQ',
  },
  {
    id: 11,
    email: 'paula.ribeiro@edu.unifor.br',
    name: 'Paula Ribeiro',
    role: 'teacher',
    course: 'Análise e Desenvolvimento de Sistemas',
    specialty: 'Qualidade de Software',
    enrollment: 'CNDB-21408',
    verificationCode: 'P6T1WC',
  },
  {
    id: 12,
    email: 'otavio.pires@edu.unifor.br',
    name: 'Otávio Pires',
    role: 'teacher',
    course: 'Ciência da Computação',
    specialty: 'Matemática Computacional',
    enrollment: 'CNDB-22190',
    verificationCode: 'O8V5MJ',
  },
  {
    id: 7,
    email: 'lucia.ferreira@edu.unifor.br',
    name: 'Lúcia Ferreira',
    role: 'coordinator',
    course: 'Análise e Desenvolvimento de Sistemas',
    specialty: 'Coordenação de curso',
    enrollment: 'COORD-1840',
    verificationCode: 'H6K3WN',
  },
  {
    id: 13,
    email: 'paulo.mendes@edu.unifor.br',
    name: 'Paulo Mendes',
    role: 'coordinator',
    course: 'Ciência da Computação',
    specialty: 'Coordenação de curso',
    enrollment: 'COORD-1902',
    verificationCode: 'C2K9RD',
  },
];

export function courseLabel(person: ListedPerson) {
  return person.specialty ? `${person.course} · ${person.specialty}` : person.course;
}

export function findListed(email: string) {
  const key = email.toLowerCase().trim();
  return LISTED_PEOPLE.find((person) => person.email === key);
}
