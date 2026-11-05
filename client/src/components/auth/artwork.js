const photo = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1800&q=85`

export const AUTH_ARTWORK = {
  Student: {
    image: photo('photo-1522202176988-66273c2fd55f'),
    alt: 'Students working together around a laptop',
    headline: 'Build skills for what comes next.',
    description: 'Learn fintech by doing: study the core systems, work through practical labs and build with your cohort.',
  },
  Instructor: {
    image: photo('photo-1509062522246-3755977927d7'),
    alt: 'An instructor teaching a classroom of students',
    headline: 'Help fintech talent grow.',
    description: 'Guide fellows through their learning, mentor project squads and give feedback that moves their work forward.',
  },
  Administrator: {
    image: photo('photo-1454165804606-c3d57bc86b40'),
    alt: 'An academy administrator reviewing plans and reports with colleagues',
    headline: 'Keep the academy moving.',
    description: 'Manage cohorts, applications, learning operations and the people building the next generation of fintech.',
  },
  Partner: {
    image: photo('photo-1521737711867-e3b97375f902'),
    alt: 'Business partners collaborating around a laptop',
    headline: 'Bring real work into learning.',
    description: 'Share your expertise, publish partner courses and connect your organisation with emerging fintech talent.',
  },
}
