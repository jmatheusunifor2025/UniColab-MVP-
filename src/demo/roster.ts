export interface ListedPerson {
  id: number;
  email: string;
  name: string;
  role: 'student' | 'teacher';
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
];

export function courseLabel(person: ListedPerson) {
  return person.specialty ? `${person.course} · ${person.specialty}` : person.course;
}

export function findListed(email: string) {
  const key = email.toLowerCase().trim();
  return LISTED_PEOPLE.find((person) => person.email === key);
}
