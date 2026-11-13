import type { SiteContent } from "@/types/content";

/**
 * Default site content. The admin editor (/admin) saves changes on top of this,
 * so anything not edited falls back to the values below.
 */
export const defaultContent: SiteContent = {
  site: {
    title: "Berlim Estúdio",
    description: "Berlim Estúdio – fotografia e vídeo.",
  },

  pages: { works: "our-works", about: "about", contact: "contato" },
  oldPages: { works: [], about: [], contact: [] },

  brand: {
    logoHero: "/images/new_logo-white.png",
    logoBar: "/images/berlim-estudio-logo-black.png",
    logoFooter: "/images/berlim-estudio-logotype-white.png",
  },

  nav: {
    items: [
      { label: "Home", href: "/" },
      { label: "Our Works", href: "/our-works" },
      { label: "About", href: "/about" },
    ],
    contact: { label: "Contato", href: "/contato" },
  },

  home: {
    slides: ["/images/hero/hero-1.jpg", "/images/hero/hero-2.jpg", "/images/hero/hero-3.jpg", "/images/hero/hero-4.jpg"],
    slidesMobile: [],
    logos: [
      { src: "/images/logos/hangar-33.png", width: 1258, height: 612 },
      { src: "/images/logos/lez-a-lez.jpg", width: 2362, height: 625 },
      { src: "/images/logos/cassol.jpg", width: 849, height: 215 },
    ],
    quote:
      "You don’t love someone for their looks, or their clothes or their fancy car, but because they sing a song only you can hear.",
    quoteHighlight: "you can hear.",
    quoteCta: { label: "Lets work together", href: "/contato" },
    serviceCards: [
      { title: "Engagements", price: "Start at $1,000", image: "/images/services/engagements.jpg" },
      { title: "Couples", price: "Start at $2,000", image: "/images/services/couples.jpg" },
      { title: "Weddings", price: "Start at $3,000", image: "/images/services/weddings.jpg" },
    ],
    serviceCta: { label: "Make an appointment", href: "/contato" },
    worksTitle: "Our latest works",
    works: [
      "roaming-the-worlds-pathways",
      "capturing-everlasting-love",
      "exploring-the-depths-of-the-heart",
      "where-reality-and-imagination-collide",
      "vibrant-expressions-in-photography",
      "a-tapestry-of-natures-colors",
    ],
    worksCta: { label: "View all", href: "/our-works" },
    testimonials: [
      {
        quote:
          "Stephen is truly an outstanding photographer (and wonderful person) with an almost mystical ability to capture the true nature of people and events. I'd recommend him to anyone!",
        name: "Peter Pan CEO",
        company: " - ThemeGoods",
        companyHref: "https://themegoods.com",
        avatar: "/images/testimonials/peter-pan.jpg",
      },
      {
        quote:
          "Thank you is simply not enough. You have captured moments that our family will treasure forever. Such a pleasure to know you. We are looking forward to seeing you at out next family event.",
        name: "Ann Doe Marketing",
        company: " - ThemeGoods",
        companyHref: "https://themegoods.com",
        avatar: "/images/testimonials/ann-doe.jpg",
      },
      {
        quote:
          "Stephen is an amazing professional at the top of his game. His images are technically superb. He has a wonderful way of putting people at ease.e knows what will make a good picture and is capable of creating the right setting.",
        name: "Mercel CEO - Apple",
        company: "",
        companyHref: "",
        avatar: "/images/testimonials/mercel.jpg",
      },
    ],
    whatWeDoTitle: "What we do",
    serviceRows: [
      { number: "01", title: "Portrait", items: ["Studio", "Event & Conference", "Outdoor"] },
      { number: "02", title: "Wedding", items: ["Pre Wedding", "Main Wedding Event", "Event Organizer"] },
      { number: "03", title: "Video", items: ["Video Shooting", "Color Grading", "Cinematic Video"] },
    ],
    whatWeDoCta: { label: "Learn more", href: "/about" },
  },

  appointment: {
    title: "Make an Appointment",
    subtitle: "Tem um projeto em mente ou precisa de fotos e vídeos para sua empresa? Conte o que procura.",
    image: "/images/appointment.jpg",
    serviceLabel: "Service",
    servicePlaceholder: { label: "Select", icon: "grid" },
    services: [
      { label: "Casual", icon: "sun" },
      { label: "Fashion", icon: "hanger" },
      { label: "Engagement", icon: "ring" },
      { label: "Wedding", icon: "heart" },
    ],
    locationLabel: "Location",
    locationAny: { label: "Any", icon: "map-pin" },
    locations: [{ label: "Photography Studio", icon: "camera" }],
    employeeLabel: "Employee",
    employeeAny: { label: "Any", icon: "users" },
    employees: [
      { label: "Jonathan Doeer", icon: "user" },
      { label: "Jane Doe", icon: "user" },
    ],
    submitLabel: "Next",
    detailsNameLabel: "Nome",
    detailsEmailLabel: "E-mail",
    detailsPhoneLabel: "Telefone",
    detailsMessageLabel: "Mensagem",
    backLabel: "Voltar",
    sendLabel: "Enviar",
    sendingMessage: "Enviando…",
    successMessage: "Obrigado! Recebemos sua mensagem e entraremos em contato em breve.",
    newReservationLabel: "Enviar outra mensagem",
  },

  works: {
    title: "Our latest works",
    allLabel: "All",
    filters: [
      { label: "Fashion", value: "fashion" },
      { label: "Portrait", value: "portrait" },
      { label: "Street Photography", value: "street-photography" },
      { label: "Travel", value: "travel" },
      { label: "Wedding", value: "wedding" },
    ],
  },

  projects: [
    { slug: "a-timeless-journey-of-love-and-commitment", title: "A Timeless Journey of Love and Commitment", category: "Portrait", image: "/images/portfolio/portfolio-7.jpg", hero: "/images/projects/timeless.jpg", tags: ["portrait", "wedding"], related: ["exploring-the-depths-of-the-heart", "a-tapestry-of-natures-colors"] },
    { slug: "capturing-everlasting-love", title: "Capturing Everlasting Love", category: "Wedding", image: "/images/portfolio/portfolio-2.jpg", hero: "/images/projects/capturing.jpg", tags: ["fashion", "street-photography", "wedding"], related: ["finding-peace-in-tranquil-scenes", "a-tapestry-of-natures-colors"] },
    { slug: "exploring-the-depths-of-the-heart", title: "Exploring the Depths of the Heart", category: "Travel", image: "/images/portfolio/portfolio-3.jpg", hero: "/images/projects/exploring.jpg", tags: ["street-photography", "travel"], related: ["a-timeless-journey-of-love-and-commitment", "capturing-everlasting-love"] },
    { slug: "where-reality-and-imagination-collide", title: "Where Reality and Imagination Collide", category: "Portrait", image: "/images/portfolio/portfolio-4.jpg", hero: "/images/projects/where-reality.jpg", tags: ["fashion", "portrait", "street-photography"], related: ["exploring-the-depths-of-the-heart", "a-tapestry-of-natures-colors"] },
    { slug: "vibrant-expressions-in-photography", title: "Vibrant Expressions in Photography", category: "Wedding", image: "/images/portfolio/portfolio-5.jpg", hero: "/images/projects/vibrant.jpg", tags: ["fashion", "portrait", "wedding"], related: ["a-tapestry-of-natures-colors", "capturing-everlasting-love"] },
    { slug: "a-tapestry-of-natures-colors", title: "A Tapestry of Nature’s Colors", category: "Travel", image: "/images/portfolio/portfolio-6.jpg", hero: "/images/projects/tapestry.jpg", tags: ["portrait", "street-photography", "travel"], related: ["a-timeless-journey-of-love-and-commitment", "capturing-everlasting-love"] },
    { slug: "finding-peace-in-tranquil-scenes", title: "Finding Peace in Tranquil Scenes", category: "Nature", image: "/images/portfolio/portfolio-8.jpg", hero: "/images/projects/finding-peace.jpg", tags: ["street-photography", "travel"], related: ["exploring-the-depths-of-the-heart", "a-tapestry-of-natures-colors"] },
    { slug: "roaming-the-worlds-pathways", title: "Roaming the World’s Pathways", category: "Portrait", image: "/images/portfolio/portfolio-1.jpg", hero: "/images/projects/roaming.jpg", tags: ["portrait", "wedding"], related: ["exploring-the-depths-of-the-heart", "a-tapestry-of-natures-colors"] },
  ],

  projectPage: {
    intro:
      "Within these pages, you will embark on a voyage through various landscapes, from breathtaking mountain peaks and vast oceans to enchanting cityscapes and serene countryside vistas.",
    meta: [
      { label: "Client", value: "Jane & Piece Morgan" },
      { label: "Where", value: "Melbourne CBD, Vic" },
      { label: "When", value: "April 2023" },
    ],
    gallery: [
      { src: "/images/projects/gallery-anita.jpg", width: 768, height: 1144 },
      { src: "/images/projects/roaming.jpg", width: 2000, height: 1333 },
      { src: "/images/projects/gallery-vintage.jpg", width: 2000, height: 1335 },
      { src: "/images/projects/gallery-elegant.jpg", width: 2000, height: 1333 },
      { src: "/images/projects/gallery-beautiful.jpg", width: 2000, height: 1333 },
      { src: "/images/projects/gallery-priscilla.jpg", width: 800, height: 1200 },
      { src: "/images/projects/vibrant.jpg", width: 2000, height: 1333 },
      { src: "/images/projects/gallery-stephanie.jpg", width: 801, height: 1200 },
      { src: "/images/projects/gallery-square.jpg", width: 1080, height: 1080 },
      { src: "/images/projects/capturing.jpg", width: 2000, height: 1333 },
      { src: "/images/projects/finding-peace.jpg", width: 1440, height: 961 },
    ],
    otherTitle: "Other works",
  },

  about: {
    heroTitle: "About Us",
    heroImage: "/images/about/hero.jpg",
    intro:
      "Our team of skilled photographers is dedicated to delivering exceptional results that exceed your expectations and preserve memories that will last a lifetime.",
    features: [
      {
        title: "Create loyal customers that love your brand",
        text: "We understand that every client is unique, and we take the time to listen and understand your specific requirements. From the initial consultation to the final delivery of your images, we strive for excellence in every aspect of our work. We believe in building strong relationships with our clients, ensuring a comfortable and enjoyable experience throughout the entire process.",
        image: "/images/about/loyal-customers.jpg",
        width: 682,
        height: 1024,
      },
      {
        title: "Tailored pricing plans designed for you",
        text: "Thank you for considering [Your Photography Business Name] for your photography needs. We look forward to working with you and capturing moments that will be cherished for generations to come. Contact us today to discuss your vision and let us create stunning imagery that tells your unique story.",
        image: "/images/about/pricing-plans.jpg",
        width: 732,
        height: 1024,
      },
    ],
    teamHidden: false,
    teamTitle: "Our Team",
    team: [
      { name: "Jenna Smith", role: "Co-Founder & Creative Director", image: "/images/about/team-0.jpg" },
      { name: "Erik Johnson", role: "Video Director", image: "/images/about/team-1.jpg" },
      { name: "John Elite", role: "Senior Photographer", image: "/images/about/team-2.jpg" },
      { name: "Louise Magnet", role: "Senior Photographer", image: "/images/about/team-3.jpg" },
    ],
  },

  contact: {
    formTitle: "Drop us a line",
    nameLabel: "Your name",
    emailLabel: "Your email",
    sessionLabel: "What type of session are you looking for?",
    sessionTypes: [
      { label: "Wedding", icon: "heart" },
      { label: "Engagement", icon: "ring" },
      { label: "Fashion", icon: "hanger" },
      { label: "Casual", icon: "sun" },
    ],
    referralLabel: "How did you hear about me?",
    referrals: [
      { label: "Facebook ads", icon: "facebook" },
      { label: "Google search", icon: "search" },
      { label: "From a friend", icon: "users" },
      { label: "Other", icon: "dots" },
    ],
    messageLabel: "Your message (optional)",
    submitLabel: "Submit",
    addressTitle: "Our Address",
    directions: {
      label: "Get directions",
      href: "https://www.google.com/maps/place/40%C2%B043'25.4%22N+74%C2%B011'36.2%22W/@40.723713,-74.1959673,17z",
      hidden: false,
    },
    image: "/images/contact.jpg",
  },

  footer: {
    contactTitle: "Contact",
    address: "The Castle Unit 345 2500 Castle Dr\nManhattan, NY",
    phone: "+216 (0)40 3629 4753",
    email: "hello@domain.com",
    menuTitle: "Menu",
    links: [
      { label: "Home", href: "/" },
      { label: "Our Works", href: "/our-works" },
      { label: "About", href: "/about" },
      { label: "Contato", href: "/contato" },
    ],
    followTitle: "Follow",
    socials: [
      { label: "Instagram", href: "https://www.instagram.com/berlimestudio/", icon: "instagram" },
      { label: "LinkedIn", href: "https://www.linkedin.com/company/berlimestudio/", icon: "linkedin" },
    ],
  },
};
