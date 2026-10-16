import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform
} from 'framer-motion';
import {
  ArrowRight,
  BedDouble,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  GlassWater,
  MapPin,
  Menu,
  Phone,
  Sparkles,
  Trees,
  Utensils,
  Waves,
  X
} from 'lucide-react';
import './styles.css';
import { supabase } from './lib/supabaseClient';
import { loadRazorpayScript, openRazorpayCheckout } from './lib/razorpay';
import { useAuth } from './admin/hooks/useAuth';
import { LoginPage } from './admin/pages/LoginPage';
import { AdminLayout } from './admin/layouts/AdminLayout';
import { DashboardPage } from './admin/pages/DashboardPage';

import { AvailabilityPage } from './admin/pages/AvailabilityPage';
import { BookingsPage } from './admin/pages/BookingsPage';
import { RoomInfoPage } from './admin/pages/RoomInfoPage';

const images = {
  logo: '/images/logo.png',
  frontDay: '/images/front-day.webp',
  facade: '/images/front-wide.webp',
  aerial: '/images/side-evening.webp',
  banquet: '/images/big-banquet.webp',
  bar: '/images/bar.webp',
  food: '/images/food.webp',
  golf: '/images/golf-car.webp',
  lobby1: '/images/lobby-1.webp',
  lobby2: '/images/lobby-2.webp',
  lobby3: '/images/lobby-3.webp',
  olive: '/images/olive-tree.webp',
  board: '/images/roadside-board.webp',
  pool: '/images/pool.webp',
  poolDay: '/images/pool-day.webp',
  palace: '/images/attraction-palace.jpg',
  mosque: '/images/attraction-mosque.jpg',
  lake: '/images/attraction-lake.jpg',
  gurudwara: '/images/attraction-gurudwara.jpg',
  barPDR: '/new-images/Bar ( sitting area ) & PDR Area.png',
  bar1: '/new-images/Bar - 1.png',
  bar2: '/new-images/Bar - 2.png',
  bigBanquet1: '/new-images/Big Banquet - 1.png',
  bigBanquet2: '/new-images/Big Banquet - 2.png',
  drinks: '/new-images/Drinks.png',
  elephant: '/new-images/Elephant.png',
  food1: '/new-images/Food - 1.png',
  food2: '/new-images/Food - 2.png',
  food3: '/new-images/Food - 3.png',
  food4: '/new-images/Food - 4.png',
  frontWidePng: '/new-images/Front Wide.png',
  frontPng: '/new-images/Front.png',
  golfCar: '/new-images/Golf Car.png',
  kitchen1: '/new-images/Kitchen - 1.png',
  kitchen2: '/new-images/Kitchen - 2.png',
  kittyHall1: '/new-images/Kitty Hall - 1.png',
  kittyHall2: '/new-images/Kitty Hall - 2.png',
  lobby1Png: '/new-images/Lobby - 1.png',
  lobby2Png: '/new-images/Lobby - 2.png',
  lobby3Png: '/new-images/Lobby - 3.png',
  lobby4: '/new-images/Lobby - 4.png',
  oliveTree: '/new-images/Olive Tree.png',
  pdr1: '/new-images/PDR - 1.png',
  pdr2: '/new-images/PDR - 2.png',
  restaurant1: '/new-images/Restaurant - 1.png',
  restaurant2: '/new-images/Restaurant - 2.png',
  restaurant3: '/new-images/Restaurant - 3.png',
  restaurant4: '/new-images/Restaurant - 4.png',
  restroom1: '/new-images/Restroom - 1.png',
  restroom2: '/new-images/Restroom - 2.png',
  roadsideBoard: '/new-images/Roadside Board.png',
  side1: '/new-images/Side - 1.png',
  side2: '/new-images/Side - 2.png',
  side3: '/new-images/Side - 3.png',
  side4: '/new-images/Side - 4.png',
  smallBanquet1: '/new-images/Small Banquet - 1.png',
  smallBanquet2: '/new-images/Small Banquet - 2.png',
  stairs: '/new-images/Stairs.png',
  swimmingPool1: '/new-images/Swimming Pool - 1.png',
  swimmingPool2: '/new-images/Swimming Pool - 2.png',
  swimmingPoolArea1: '/new-images/Swimming Pool Area - 1.png',
  swimmingPoolArea2: '/new-images/Swimming Pool Area - 2.png',
  room1: '/room-images/IMG_8540.JPG.jpeg',
  room2: '/room-images/IMG_8541.PNG',
  room3: '/room-images/IMG_8542.PNG',
  room4: '/room-images/IMG_8543.PNG',
  room5: '/room-images/IMG_8544.PNG',
  room6: '/room-images/IMG_8545.PNG',
  room7: '/room-images/IMG_8546.PNG',
  room8: '/room-images/IMG_8547.PNG',
  room9: '/room-images/IMG_8548.PNG',
};

// All pages — used by the full-screen menu overlay (shows everything)
const nav = [
  { label: 'Home', page: 'home' },
  { label: 'About Resort', page: 'resort' },
  { label: 'Rooms', page: 'rooms' },
  { label: 'Banquets', page: 'banquets' },
  { label: 'Dining / Restaurant', page: 'restaurant' },
  { label: 'Bar', page: 'bar' },
  { label: 'Kitty Halls', page: 'kitty-halls' },
  { label: 'PDRs', page: 'pdrs' },
  { label: 'Offers', page: 'offers' },
  { label: 'Bookings', page: 'bookings' },
  { label: 'Gallery', page: 'gallery' },
  { label: 'Contact', page: 'contact' }
];

// Desktop top-bar groups
const desktopNavGroups = [
  {
    label: 'Home',
    page: 'home'
  },
  {
    label: 'Resort',
    items: [
      { label: 'About Resort', page: 'resort' },
      { label: 'Gallery', page: 'gallery' },
      { label: 'Offers', page: 'offers' }
    ]
  },
  {
    label: 'Rooms',
    page: 'rooms'
  },
  {
    label: 'Halls',
    items: [
      { label: 'Banquet Halls', page: 'banquets' },
      { label: 'Kitty Hall', page: 'kitty-halls' },
      { label: 'PDRs', page: 'pdrs' }
    ]
  },
  {
    label: 'Dining',
    items: [
      { label: 'Restaurant', page: 'restaurant' },
      { label: 'Bar', page: 'bar' }
    ]
  },
  {
    label: 'Contact',
    page: 'contact'
  }
];

const heroSlides = [
  {
    image: images.frontDay,
    label: 'Arrival',
    title: 'Olive Green Resort & Villas',
    copy: 'A grand Kapurthala resort for stays, celebrations, dining and landscaped hospitality. Experience an oasis of tranquility where every detail is crafted for your utmost comfort and luxury.'
  },
  {
    image: images.facade,
    label: 'Resort',
    title: 'A grand green arrival',
    copy: 'Night-lit architecture, sprawling gardens, and calm hospitality near Kanjli Lake. A perfect blend of heritage-inspired design and modern luxury.'
  },
  {
    image: images.poolDay,
    label: 'Leisure',
    title: 'Poolside resort living',
    copy: 'Sunny water, exclusive villa stays, and slower moments inside the Olive Green campus. Unwind in our temperature-controlled pool surrounded by nature.'
  }
];

const manifesto = [
  'Luxury without noise',
  'Gardens before glass',
  'Celebrations with room to breathe',
  'Hospitality that feels personal'
];

const venues = [
  {
    title: 'Banquet Hall',
    meta: 'Weddings / Receptions / Corporate dinners',
    image: images.banquet,
    copy: 'A formal hall with sculpted ceilings, magnificent chandeliers, excellent stage visibility, and generous dining layouts for your grandest celebrations.'
  },
  {
    title: 'Royal Lobby',
    meta: 'Arrival / Lounge / Portrait gallery',
    image: images.lobby2,
    copy: 'A long marble gallery of chandeliers, premium drapery, and plush seating for arrivals that feel composed, welcoming, and truly royal.'
  },
  {
    title: 'Restaurant & Bar',
    meta: 'Dining / Cocktails / Private hosting',
    image: images.bar,
    copy: 'A warm lounge language for dinner service, artisanal beverages, and after-event conversations, offering a curated menu of global and local delicacies.'
  },
  {
    title: 'Garden Court',
    meta: 'Landscapes / Outdoor flow / Photo moments',
    image: images.aerial,
    copy: 'Illuminated gardens, elegant fountains, and wide paved courts frame the resort from day into night, providing a breathtaking backdrop for any occasion.'
  }
];

const amenities = [
  { icon: BedDouble, label: 'Rooms & villa stays' },
  { icon: Utensils, label: 'Restaurant' },
  { icon: GlassWater, label: 'Bar lounge' },
  { icon: CalendarDays, label: 'Banquet events' },
  { icon: Waves, label: 'Poolside leisure' },
  { icon: Trees, label: 'Landscaped grounds' }
];

const eventChoices = [
  'Banquet enquiry',
  'Restaurant & lounge',
  'Poolside gathering'
];

const initialBooking = {
  arrival: '',
  departure: '',
  guests: '2',
  rooms: '1',
  stayType: '',
  name: '',
  phone: '',
  email: '',
  notes: ''
};

const gallery = [
  { image: images.frontWidePng, title: 'Grand front facade', area: 'Arrival' },
  { image: images.frontPng, title: 'Illuminated facade', area: 'Arrival' },
  { image: images.aerial, title: 'Garden court', area: 'Exterior' },
  { image: images.side1, title: 'Resort exterior', area: 'Exterior' },
  { image: images.side2, title: 'Resort pathway', area: 'Exterior' },
  { image: images.side3, title: 'Outdoor view', area: 'Exterior' },
  { image: images.side4, title: 'Resort view', area: 'Exterior' },
  { image: images.roadsideBoard, title: 'Roadside board', area: 'Wayfinding' },
  { image: images.lobby1Png, title: 'Resort Lobby', area: 'Interior' },
  { image: images.lobby2Png, title: 'Marble gallery', area: 'Interior' },
  { image: images.lobby3Png, title: 'Salon corridor', area: 'Interior' },
  { image: images.lobby4, title: 'Lobby sitting', area: 'Interior' },
  { image: images.stairs, title: 'Grand staircase', area: 'Interior' },
  { image: images.elephant, title: 'Decor', area: 'Interior' },
  { image: images.restroom1, title: 'Luxury restroom', area: 'Interior' },
  { image: images.restroom2, title: 'Restroom interior', area: 'Interior' },
  { image: images.bigBanquet1, title: 'Grand banquet', area: 'Events' },
  { image: images.bigBanquet2, title: 'Banquet seating', area: 'Events' },
  { image: images.smallBanquet1, title: 'Small banquet', area: 'Events' },
  { image: images.smallBanquet2, title: 'Small banquet view', area: 'Events' },
  { image: images.kittyHall1, title: 'Kitty Hall', area: 'Events' },
  { image: images.kittyHall2, title: 'Kitty Hall setup', area: 'Events' },
  { image: images.restaurant1, title: 'Restaurant dining', area: 'Dining' },
  { image: images.restaurant2, title: 'Restaurant tables', area: 'Dining' },
  { image: images.restaurant3, title: 'Restaurant view', area: 'Dining' },
  { image: images.restaurant4, title: 'Restaurant seating', area: 'Dining' },
  { image: images.pdr1, title: 'Private Dining', area: 'Dining' },
  { image: images.pdr2, title: 'Private Dining setup', area: 'Dining' },
  { image: images.bar1, title: 'Bar lounge', area: 'Dining' },
  { image: images.bar2, title: 'Bar interior', area: 'Dining' },
  { image: images.barPDR, title: 'Bar & PDR', area: 'Dining' },
  { image: images.drinks, title: 'Refreshments', area: 'Dining' },
  { image: images.food1, title: 'Signature plate', area: 'Dining' },
  { image: images.food2, title: 'Culinary delight', area: 'Dining' },
  { image: images.food3, title: 'Gourmet meal', area: 'Dining' },
  { image: images.food4, title: 'Chef special', area: 'Dining' },
  { image: images.kitchen1, title: 'Resort kitchen', area: 'Back of house' },
  { image: images.kitchen2, title: 'Chef kitchen', area: 'Back of house' },
  { image: images.golfCar, title: 'Garden buggy', area: 'Grounds' },
  { image: images.oliveTree, title: 'Olive tree', area: 'Landscape' },
  { image: images.swimmingPool1, title: 'Swimming Pool', area: 'Leisure' },
  { image: images.swimmingPool2, title: 'Pool view', area: 'Leisure' },
  { image: images.swimmingPoolArea1, title: 'Poolside', area: 'Leisure' },
  { image: images.swimmingPoolArea2, title: 'Pool lounging', area: 'Leisure' },
  { image: images.room1, title: 'Luxury Villa Bedroom', area: 'Rooms' },
  { image: images.room2, title: 'Villa Living Area', area: 'Rooms' },
  { image: images.room3, title: 'Premium Suite', area: 'Rooms' },
  { image: images.room4, title: 'Villa Interiors', area: 'Rooms' },
  { image: images.room5, title: 'Elegant Setup', area: 'Rooms' },
  { image: images.room6, title: 'Spacious Room', area: 'Rooms' },
  { image: images.room7, title: 'Comfort & Luxury', area: 'Rooms' },
  { image: images.room8, title: 'Restful Sleep', area: 'Rooms' },
  { image: images.room9, title: 'Room Amenities', area: 'Rooms' },
  { image: images.frontDay, title: 'Resort day view', area: 'Exterior' },
  { image: images.facade, title: 'Classic facade', area: 'Arrival' },
  { image: images.banquet, title: 'Banquet setup', area: 'Events' },
  { image: images.bar, title: 'Classic Bar', area: 'Dining' },
  { image: images.food, title: 'Classic dish', area: 'Dining' },
  { image: images.golf, title: 'Golf cart', area: 'Grounds' },
  { image: images.lobby1, title: 'Classic lobby 1', area: 'Interior' },
  { image: images.lobby2, title: 'Classic lobby 2', area: 'Interior' },
  { image: images.lobby3, title: 'Classic lobby 3', area: 'Interior' },
  { image: images.olive, title: 'Classic olive tree', area: 'Landscape' },
  { image: images.pool, title: 'Classic pool', area: 'Leisure' },
  { image: images.poolDay, title: 'Classic pool day', area: 'Leisure' },
  { image: images.palace, title: 'Kapurthala Palace', area: 'Local Attractions' },
  { image: images.mosque, title: 'Moorish Mosque', area: 'Local Attractions' },
  { image: images.lake, title: 'Kanjli Wetland', area: 'Local Attractions' },
  { image: images.gurudwara, title: 'Sultanpur Lodhi', area: 'Local Attractions' }
];

function usePointer() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const springX = useSpring(x, { stiffness: 220, damping: 32 });
  const springY = useSpring(y, { stiffness: 220, damping: 32 });

  useEffect(() => {
    const onMove = (event) => {
      x.set(event.clientX - 22);
      y.set(event.clientY - 22);
    };

    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [x, y]);

  return { x: springX, y: springY };
}

function pageHref(page) {
  return page === 'home' ? '#/' : `#/${page}`;
}

function pageFromHash() {
  let hashPage = window.location.hash.replace(/^#\/?/, '');
  
  if (window.location.pathname.startsWith('/admin')) {
    // If we have a hash and it's an admin route, use the hash (internal admin navigation)
    if (hashPage.startsWith('admin/')) {
      return hashPage;
    }
    // Otherwise, prioritize the pathname (user just arrived at /admin, maybe with a lingering public hash)
    let pathPage = window.location.pathname.replace(/^\//, '');
    if (pathPage === 'admin' || pathPage === 'admin/') {
      return 'admin/dashboard';
    }
    if (pathPage.startsWith('admin/')) {
      return pathPage;
    }
  }

  let page = hashPage || 'home';
  const validPages = ['home', 'checkout', ...nav.map((item) => item.page)];
  return validPages.includes(page) ? page : 'home';
}

function Header({ setMenuOpen, setPage }) {
  return (
    <header className="site-header">
      <a className="brand" href={pageHref('home')} onClick={() => setPage('home')} aria-label="Olive Green Resort & Villas home">
        <img src={images.logo} alt="Olive Green Resort & Villas" />
      </a>
      <nav className="desktop-nav" aria-label="Primary navigation">
        {desktopNavGroups.map((group) => {
          if (group.page) {
            return (
              <a key={group.label} href={pageHref(group.page)} onClick={() => setPage(group.page)}>
                {group.label}
              </a>
            );
          }
          return (
            <div key={group.label} className="nav-dropdown-group">
              <span className="nav-dropdown-label">{group.label}</span>
              <div className="nav-dropdown-menu">
                {group.items.map(subItem => (
                  <a key={subItem.label} href={pageHref(subItem.page)} onClick={() => setPage(subItem.page)}>
                    {subItem.label}
                  </a>
                ))}
              </div>
            </div>
          );
        })}
      </nav>
      <div className="header-actions">
        <a className="header-book-btn" href={pageHref('bookings')} onClick={() => setPage('bookings')}>
          Book Now
        </a>
        <button className="menu-button" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <Menu size={22} />
        </button>
      </div>
    </header>
  );
}

function Loader({ loaded }) {
  return (
    <AnimatePresence>
      {!loaded && (
        <motion.div
          className="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, y: '-100%' }}
          transition={{ duration: 0.72, ease: [0.76, 0, 0.24, 1] }}
        >
          <div className="loader-stage" aria-label="Loading Olive Green Resort & Villas">
            <motion.div
              className="loader-line"
              initial={{ scaleX: 0, rotate: -2 }}
              animate={{ scaleX: [0, 1, 1, 0.08], rotate: [-2, 3, -1, 0] }}
              transition={{ duration: 1.8, ease: [0.76, 0, 0.24, 1], times: [0, 0.45, 0.75, 1] }}
            />
            <motion.div
              className="loader-orb"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1, 1.08, 0.7], y: [20, 0, -8, 20] }}
              transition={{ duration: 1.9, delay: 0.22, ease: 'easeInOut' }}
            />
            <motion.div
              className="loader-title"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: [0, 1, 1, 0], y: [28, 0, 0, -22] }}
              transition={{ duration: 2.05, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <span>Olive</span>
              <span>Green</span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MenuOverlay({ menuOpen, setMenuOpen, setPage }) {
  return (
    <AnimatePresence>
      {menuOpen && (
        <motion.div
          className="menu-overlay"
          initial={{ y: '-100%' }}
          animate={{ y: 0 }}
          exit={{ y: '-100%' }}
          transition={{ duration: 0.58, ease: [0.76, 0, 0.24, 1] }}
        >
          <button className="menu-close" onClick={() => setMenuOpen(false)} aria-label="Close menu">
            <X size={34} />
          </button>
          <div className="menu-logo">
            <img src={images.logo} alt="Olive Green Resort & Villas" />
          </div>
          <div className="menu-links">
            {nav.map((item, index) => (
              <motion.a
                href={pageHref(item.page)}
                key={item.label}
                onClick={() => {
                  setPage(item.page);
                  setMenuOpen(false);
                }}
                initial={{ opacity: 0, y: 28 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14 + index * 0.06 }}
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                {item.label}
              </motion.a>
            ))}
          </div>
          <div className="menu-contact">
            <span>Near Kanjli Lake, Subhanpur Road, Kapurthala</span>
            <a href="mailto:cmd@olivegreenresortandvilla.com">cmd@olivegreenresortandvilla.com</a>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Hero() {
  const [slide, setSlide] = useState(0);
  const current = heroSlides[slide];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSlide((value) => (value + 1) % heroSlides.length);
    }, 6200);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="hero" id="top" aria-label="Olive Green Resort introduction">
      <AnimatePresence>
        <motion.img
          key={current.image}
          src={current.image}
          alt=""
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />
      </AnimatePresence>
      <div className="hero-overlay" />
      <div className="hero-panel">

        <AnimatePresence mode="wait">
          <motion.div
            key={current.title}
            initial={{ opacity: 0, y: 38 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.48 }}
          >
            <h1>{current.title}</h1>
            <p>{current.copy}</p>
          </motion.div>
        </AnimatePresence>
        <div className="hero-actions">
          <a href={pageHref('venues')}>
            Explore spaces
            <ArrowRight size={20} />
          </a>
          <a href={pageHref('contact')}>Plan a visit</a>
        </div>
      </div>
      <div className="hero-wordmark" aria-hidden="true">
        <span>Olive</span>
        <span>Green</span>
      </div>
      <div className="slide-controls" aria-label="Hero slide controls">
        <button onClick={() => setSlide((slide + heroSlides.length - 1) % heroSlides.length)} aria-label="Previous slide">
          <ChevronLeft size={21} />
        </button>
        <span>
          {String(slide + 1).padStart(2, '0')} / {String(heroSlides.length).padStart(2, '0')}
        </span>
        <button onClick={() => setSlide((slide + 1) % heroSlides.length)} aria-label="Next slide">
          <ChevronRight size={21} />
        </button>
      </div>
    </section>
  );
}

function Intro() {
  return (
    <section className="intro">
      <div className="intro-copy">
        <span className="tiny-label">Resort profile</span>
        <h2>
          A resort made for <em>celebration</em>, quiet stays and the camera roll.
        </h2>
      </div>
      <div className="intro-text">
        <p>
          Olive Green Resort & Villas sits near Kanjli Lake on Subhanpur Road, Kapurthala, with a
          hospitality mix built around rooms, villa stays, banquet events, restaurant dining, a bar
          lounge, poolside leisure and manicured green landscapes.
        </p>
        <p>
          The new brand image leans into what the place already owns: a bold name, a living olive
          tree, night-lit architecture, royal interiors and a resort campus that feels event-ready.
        </p>
      </div>
    </section>
  );
}

function Manifesto() {
  return (
    <section className="manifesto">
      <div className="manifesto-pin">
        <Sparkles size={36} />
        <strong>Stay green. Host grand.</strong>
      </div>
      <div className="manifesto-list">
        {manifesto.map((item) => (
          <motion.p
            key={item}
            initial={{ opacity: 0.2, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.55 }}
            transition={{ duration: 0.55 }}
          >
            {item}
          </motion.p>
        ))}
      </div>
    </section>
  );
}

function VenueGrid() {
  return (
    <section className="venues page-section">
      <div className="section-heading">
        <span className="tiny-label">Venues</span>
        <h2>Spaces with presence.</h2>
      </div>
      <div className="venue-grid">
        {venues.map((venue, index) => (
          <motion.article
            className="venue-tile"
            key={venue.title}
            initial={{ opacity: 0, y: 42 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.64, delay: index * 0.06 }}
          >
            <img src={venue.image} alt={venue.title} />
            <div>
              <span>{venue.meta}</span>
              <h3>{venue.title}</h3>
              <p>{venue.copy}</p>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function Dining() {
  return (
    <section className="dining page-section">
      <div className="dining-media">
        <img src={images.food} alt="Plated food and drink at Olive Green Resort & Villas" />
        <img src={images.bar} alt="Bar lounge at Olive Green Resort & Villas" />
      </div>
      <div className="dining-copy">
        <span className="tiny-label">Dining & lounge</span>
        <h2>Meals with a little theatre.</h2>
        <p>
          Restaurant service, banquet catering and a darker bar lounge give the property an all-day
          rhythm: breakfast before travel, lunch around meetings, dinner after ceremonies, and
          cocktails once the lights come on.
        </p>
        <div className="amenity-row">
          {amenities.map(({ icon: Icon, label }) => (
            <span key={label}>
              <Icon size={18} />
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Signature() {
  return (
    <section className="signature">
      <img src={images.olive} alt="Olive tree landscape feature at Olive Green Resort & Villas" />
      <div>
        <span className="tiny-label">Living symbol</span>
        <h2>The olive tree becomes the brand mark.</h2>
        <p>
          The mature tree in the garden gives the resort a rare physical identity: not just a logo,
          but a photographed landmark guests can meet, remember and share.
        </p>
      </div>
    </section>
  );
}

function Gallery() {
  const [active, setActive] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const visibleGallery = useMemo(() => (showAll ? gallery : gallery.slice(0, 6)), [showAll]);

  return (
    <section className="gallery-section page-section">
      <div className="gallery-top">
        <div>
          <span className="tiny-label">Gallery</span>
          <h2>Proof in pictures.</h2>
        </div>
      </div>
      <div className="gallery-grid">
        {visibleGallery.map((item, index) => (
          <motion.button
            className={index === 0 || index === 5 ? 'wide' : ''}
            key={item.title}
            onClick={() => setActive(item)}
            initial={{ opacity: 0, scale: 0.98, y: 30 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.7, delay: (index % 4) * 0.1 }}
          >
            <img src={item.image} alt={item.title} />
            <span>
              <small>{item.area}</small>
              {item.title}
            </span>
          </motion.button>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
        <button className="gallery-more-btn" onClick={() => setShowAll((value) => !value)}>
          {showAll ? 'Show less' : 'Show more'}
          <ArrowRight size={18} />
        </button>
      </div>
      <AnimatePresence>
        {active && (
          <motion.div
            className="lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
          >
            <button aria-label="Close gallery">
              <X size={30} />
            </button>
            <motion.img
              src={active.image}
              alt={active.title}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
            />
            <p>{active.area} / {active.title}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

function Contact() {
  return (
    <section className="contact page-section">
      <div className="contact-image">
        <iframe
          className="contact-map"
          src="https://maps.google.com/maps?q=Olive+Green+Resorts+and+Villa,Kapurthala&output=embed"
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Olive Green Resort Map"
        ></iframe>
      </div>
      <div className="contact-copy">
        <span className="tiny-label">Contact</span>
        <h2>Plan the stay. Book the hall. Walk the gardens.</h2>
        <div className="contact-lines">
          <a href="https://maps.google.com/?q=Near%20Kanjli%20Lake%2C%20Subhanpur%20Road%2C%20Kapurthala" target="_blank" rel="noreferrer">
            <MapPin size={21} />
            Near Kanjli Lake, Subhanpur Road, Kapurthala
          </a>
          <a href="tel:+917083300001">
            <Phone size={21} />
            +91 70833 00001
          </a>
          <a href="mailto:cmd@olivegreenresortandvilla.com">
            <Sparkles size={21} />
            cmd@olivegreenresortandvilla.com
          </a>
        </div>
      </div>
    </section>
  );
}

function BookingSection({ title, copy, showHighlights = true }) {
  const [booking, setBooking] = useState(initialBooking);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [paying, setPaying] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);
  
  // Checkout specific state
  const [showCheckout, setShowCheckout] = useState(false);
  const [withBreakfast, setWithBreakfast] = useState(false);
  const [withExtraBed, setWithExtraBed] = useState(false);

  const updateBooking = (event) => {
    const { name, value } = event.target;
    setBooking((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setSubmitted(false);
  };

  const validateBooking = () => {
    const nextErrors = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const arrival = booking.arrival ? new Date(booking.arrival) : null;
    const departure = booking.departure ? new Date(booking.departure) : null;

    if (!arrival) nextErrors.arrival = "Required";
    else if (arrival < today) nextErrors.arrival = "Cannot be in the past";

    if (!departure) nextErrors.departure = "Required";
    else if (arrival && departure <= arrival) nextErrors.departure = "Must be after check-in";

    if (!booking.name.trim()) nextErrors.name = "Required";
    if (!booking.phone.trim()) nextErrors.phone = "Required";
    if (!booking.email.trim()) nextErrors.email = "Required";
    else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(booking.email)) nextErrors.email = "Invalid address";

    return nextErrors;
  };

  useEffect(() => {
    const fetchRooms = async () => {
      if (!booking.arrival || !booking.departure) return;
      const arrivalDate = new Date(booking.arrival);
      const departureDate = new Date(booking.departure);
      if (departureDate <= arrivalDate) return;

      setLoadingRooms(true);
      try {
        const { data, error } = await supabase.rpc("get_room_types_with_availability", {
          p_check_in: booking.arrival,
          p_check_out: booking.departure
        });

        if (error) throw error;
        setAvailableRooms(data || []);
      } catch (err) {
        console.error("Error fetching available rooms:", err);
      } finally {
        setLoadingRooms(false);
      }
    };

    fetchRooms();
  }, [booking.arrival, booking.departure]);

  useEffect(() => {
    if (availableRooms.length > 0) {
      const isRoomSelection = availableRooms.some(r => r.name === booking.stayType && r.is_available);
      const isEventSelection = eventChoices.includes(booking.stayType);

      if (!isRoomSelection && !isEventSelection) {
        const firstAvailable = availableRooms.find(r => r.is_available);
        if (firstAvailable) {
          setBooking(current => ({ ...current, stayType: firstAvailable.name }));
        }
      }
    }
  }, [availableRooms]);

  const handleProceedToCheckout = (event) => {
    event.preventDefault();
    const nextErrors = validateBooking();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    const isEventSelection = eventChoices.includes(booking.stayType);
    if (isEventSelection) {
      // It's an event enquiry
      setSuccessInfo({
        title: "Enquiry received.",
        detail: `We have captured your ${booking.stayType?.toLowerCase()} request for ${booking.guests} guest(s). Olive Green will follow up with details.`
      });
      setSubmitted(true);
      return;
    }
    
    if (availableRooms.length === 0) {
      setErrors({ ...nextErrors, submit: "Sorry, we are not accepting online bookings at this time." });
      return;
    }
    
    const selectedRoom = availableRooms.find(r => r.name === booking.stayType && r.is_available);
    if (!selectedRoom) {
      setErrors({ ...nextErrors, submit: "Sorry, all rooms are occupied for the selected duration." });
      return;
    }
    
    sessionStorage.setItem('checkoutData', JSON.stringify({ booking, selectedRoom }));
    window.location.hash = '/checkout';
  };

  const handlePayNow = async () => {
    const selectedRoom = availableRooms.find(r => r.name === booking.stayType);
    if (!selectedRoom) return;

    setPaying(true);
    try {
      const { data: orderData, error: orderError } = await supabase.functions.invoke("create-booking-order", {
        body: {
          room_type_id: selectedRoom.id,
          check_in: booking.arrival,
          check_out: booking.departure,
          guest_name: booking.name,
          guest_email: booking.email,
          guest_phone: booking.phone,
          guests_count: Number(booking.guests || 2),
          qty: Number(booking.rooms || 1),
          notes: booking.notes,
          with_breakfast: withBreakfast,
          with_extra_bed: withExtraBed
        }
      });

      if (orderError || !orderData) {
        throw new Error(orderError?.message || "Failed to create booking order");
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Razorpay SDK failed to load. Please check your internet connection.");
      }

      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Olive Green Resort & Villas",
        description: `Booking for ${selectedRoom.name}`,
        order_id: orderData.razorpay_order_id,
        prefill: {
          name: booking.name,
          email: booking.email,
          contact: booking.phone
        },
        handler: async (response) => {
          setPaying(true);
          try {
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke("verify-payment", {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              }
            });

            if (verifyError || !verifyData || !verifyData.success) {
              throw new Error(verifyError?.message || "Payment verification failed");
            }

            setSuccessInfo({
              title: "Booking Confirmed!",
              detail: `Your booking for ${selectedRoom.name} from ${booking.arrival} to ${booking.departure} is confirmed. Payment ID: ${response.razorpay_payment_id}.`
            });
            setSubmitted(true);
            setShowCheckout(false);
          } catch (err) {
            console.error("Verification error:", err);
            setErrors({ submit: err.message || "Payment verification failed. Please contact support." });
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
            setErrors({ submit: "Checkout was cancelled. You can try paying again." });
          }
        },
        theme: {
          color: "#4f661f"
        }
      };

      openRazorpayCheckout(options);
    } catch (err) {
      console.error("Order creation error:", err);
      setErrors({ submit: err.message || "Failed to initiate booking payment." });
      setPaying(false);
    }
  };

  const selectedRoom = availableRooms.find(r => r.name === booking.stayType);

  let nights = 0;
  let roomSubtotal = 0;
  let breakfastSubtotal = 0;
  let extraBedSubtotal = 0;
  let totalAmount = 0;

  if (showCheckout && selectedRoom) {
    const arrivalDate = new Date(booking.arrival);
    const departureDate = new Date(booking.departure);
    nights = Math.round((departureDate.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24));
    
    roomSubtotal = Number(selectedRoom.base_price) * nights * Number(booking.rooms || 1);
    
    if (withBreakfast) {
      breakfastSubtotal = 1000 * nights * Number(booking.rooms || 1);
    }

    if (withExtraBed) {
      extraBedSubtotal = 1000 * nights * Number(booking.rooms || 1);
    }
    
    totalAmount = roomSubtotal + breakfastSubtotal + extraBedSubtotal;
  }

  if (showCheckout && selectedRoom) {
    return (
      <section className="booking page-section checkout-section">
        <div className="checkout-container">
          <button className="back-btn" onClick={() => setShowCheckout(false)}>&larr; Back to details</button>
          
          <div className="checkout-grid">
            <div className="checkout-details">
              <h3>Order Summary</h3>
              <div className="summary-card">
                <h4>{selectedRoom.name}</h4>
                <p>{booking.rooms} Room{booking.rooms > 1 ? "s" : ""} • {booking.guests} Guest{booking.guests > 1 ? "s" : ""}</p>
                <div className="dates-row">
                  <div>
                    <span className="tiny-label">Check-in</span>
                    <strong>{new Date(booking.arrival).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</strong>
                  </div>
                  <ArrowRight size={16} style={{ marginTop: "16px" }} />
                  <div>
                    <span className="tiny-label">Check-out</span>
                    <strong>{new Date(booking.departure).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</strong>
                  </div>
                </div>
              </div>

              <h3>Optional Add-ons</h3>
              <div className="meal-options">
                <label className={"meal-option " + (withBreakfast ? "selected" : "")}>
                  <input type="checkbox" checked={withBreakfast} onChange={(e) => setWithBreakfast(e.target.checked)} />
                  <div>
                    <strong>Morning Breakfast</strong>
                    <span>Includes morning breakfast</span>
                  </div>
                </label>
                <label className={"meal-option " + (withExtraBed ? "selected" : "")}>
                  <input type="checkbox" checked={withExtraBed} onChange={(e) => setWithExtraBed(e.target.checked)} />
                  <div>
                    <strong>Extra Bed</strong>
                    <span>Additional bed in the room</span>
                  </div>
                </label>
              </div>

              <h3>Guest Details</h3>
              <div className="guest-info-card">
<p><strong>{booking.name}</strong></p>
<p>{booking.email}</p>
<p>{booking.phone}</p>
</div>
<h3>Special Requests</h3>
<div className="guest-info-card" style={{ padding: '0', background: 'none' }}>
<textarea name="notes" rows="3" value={booking.notes} onChange={updateBooking} placeholder="Early check-in, extra bed, dietary notes or anything the team should know." style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', fontFamily: 'inherit', resize: 'vertical' }} />
</div>
            </div>

            <div className="checkout-sidebar">
              <h3>Price Breakdown</h3>
              <div className="price-breakdown">
                <div className="price-row">
                  <span>Room Charges ({nights} Night{nights > 1 ? "s" : ""})</span>
                  <span>₹{roomSubtotal.toLocaleString()}</span>
                </div>
                {withBreakfast && (
                  <div className="price-row">
                    <span>Breakfast Charges</span>
                    <span>₹{breakfastSubtotal.toLocaleString()}</span>
                  </div>
                )}
                {withExtraBed && (
                  <div className="price-row">
                    <span>Extra Bed Charges</span>
                    <span>₹{extraBedSubtotal.toLocaleString()}</span>
                  </div>
                )}
                <div className="price-row total">
                  <strong>Total Amount</strong>
                  <strong>₹{totalAmount.toLocaleString()}</strong>
                </div>
              </div>
              
              {errors.submit && (
                <div className="form-error-msg" style={{ marginTop: "24px" }}>
                  {errors.submit}
                </div>
              )}

              <button className="checkout-pay-btn" onClick={handlePayNow} disabled={paying}>
                {paying ? "Processing Securely..." : `Pay ₹${totalAmount.toLocaleString()}`}
                <ArrowRight size={19} />
              </button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
      <section className="booking page-section">
        <div className="booking-copy">
          <span className="tiny-label">Booking enquiry</span>
          <h2>{title || "Start with the dates."}</h2>
          {showHighlights && (
            <div className="booking-highlights">
              <span><CalendarDays size={18} /> Date-led request</span>
              <span><BedDouble size={18} /> Rooms / villas</span>
              <span><Sparkles size={18} /> Quick confirmation</span>
            </div>
          )}
        </div>
        <form className="booking-form" onSubmit={handleProceedToCheckout} noValidate>
            <label>
              <span>Check in</span>
              <input type="date" name="arrival" value={booking.arrival} onChange={updateBooking} min={new Date().toISOString().split("T")[0]} />
              {errors.arrival && <small>{errors.arrival}</small>}
            </label>
            <label>
              <span>Check out</span>
              <input type="date" name="departure" value={booking.departure} onChange={updateBooking} min={booking.arrival || new Date().toISOString().split("T")[0]} />
              {errors.departure && <small>{errors.departure}</small>}
            </label>
            
            {booking.arrival && booking.departure && !loadingRooms && availableRooms.length === 0 && !eventChoices.includes(booking.stayType) && (
              <div className="full-width" style={{ padding: '0.75rem', border: '1px solid #ffcdd2', borderRadius: '4px', backgroundColor: '#ffebee', color: '#c62828', textAlign: 'center', margin: '8px 0' }}>
                Sorry, we are not accepting online bookings at this time.
              </div>
            )}
            
            {booking.arrival && booking.departure && !loadingRooms && availableRooms.length > 0 && !availableRooms[0].is_available && !eventChoices.includes(booking.stayType) && (
              <div className="full-width" style={{ padding: '0.75rem', border: '1px solid #ffcdd2', borderRadius: '4px', backgroundColor: '#ffebee', color: '#c62828', textAlign: 'center', margin: '8px 0' }}>
                Sorry, all rooms are occupied for the selected duration.
              </div>
            )}

            <label>
              <span>Guests</span>
              <input type="number" name="guests" min="1" max="80" value={booking.guests} onChange={updateBooking} />
            </label>
            <label>
              <span>Rooms</span>
              <input type="number" name="rooms" min="1" max="20" value={booking.rooms} onChange={updateBooking} />
            </label>
            <label>
              <span>Lead guest name</span>
              <input type="text" name="name" value={booking.name} onChange={updateBooking} placeholder="Your name" />
              {errors.name && <small>{errors.name}</small>}
            </label>
            <label>
              <span>Phone</span>
              <input type="tel" name="phone" value={booking.phone} onChange={updateBooking} placeholder="+91 98765 43210" />
              {errors.phone && <small>{errors.phone}</small>}
            </label>
          <label>
            <span>Email</span>
            <input type="email" name="email" value={booking.email} onChange={updateBooking} placeholder="name@example.com" />
            {errors.email && <small>{errors.email}</small>}
          </label>
          

          {errors.submit && (
            <div className="form-error-msg">
              {errors.submit}
            </div>
          )}

          <button type="submit">
            Book Now
            <ArrowRight size={19} />
          </button>
          
          {submitted && successInfo && (
            <motion.div
              className="booking-confirmation"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <strong>{successInfo.title}</strong>
              <span>{successInfo.detail}</span>
            </motion.div>
          )}
        </form>
      </section>
  );
}

function BookingPage() {
  return (
    <>
      <PageHero
        label="Bookings"
        title="Reserve the stay. Enquire for the occasion."
        copy="Share your dates, room needs and event preferences. The team can follow up with availability and details."
        image={images.pool}
      />
      <BookingSection />
    </>
  );
}

function PageHero({ label, title, copy, image, action }) {
  return (
    <section className="page-hero">
      <motion.img 
        src={image} 
        alt="" 
        initial={{ opacity: 0, scale: 1.1 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 6, ease: 'easeOut' }}
      />
      <div className="hero-overlay" />
      <div>
        <span className="tiny-label">{label}</span>
        <h1>{title}</h1>
        {copy && <p>{copy}</p>}
        {action && <div style={{ marginTop: '24px' }}>{action}</div>}
      </div>
    </section>
  );
}

function HomeBookingForm() {
  const [formData, setFormData] = useState({ name: '', phone: '', city: '', bookingType: 'Rooms', date: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        setSubmitted(true);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to send enquiry. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Is the email server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="home-booking page-section">
      <div className="home-booking-copy">
        <span className="tiny-label">Booking Enquiry</span>
        <h2>Reserve your luxury stay.</h2>
      </div>
      <form onSubmit={handleSubmit} className="booking-form" noValidate>
        <div className="form-grid">
          <label>
            <span>Name</span>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Your Name" />
          </label>
          <label>
            <span>Phone Number</span>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="+91 98765 43210" />
          </label>
          <label>
            <span>City</span>
            <input type="text" name="city" value={formData.city} onChange={handleChange} required placeholder="Your City" />
          </label>
          <label>
            <span>Booking Type</span>
            <select name="bookingType" value={formData.bookingType} onChange={handleChange}>
              <option value="Rooms">Rooms</option>
              <option value="Banquets">Banquets</option>
              <option value="Kitty Hall">Kitty Hall</option>
              <option value="Restaurant">Restaurant</option>
            </select>
          </label>
        </div>
        <label>
          <span>Date</span>
          <input type="date" name="date" value={formData.date} onChange={handleChange} required />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Submit Enquiry'}
          {!loading && <ArrowRight size={19} />}
        </button>
        {error && <p className="form-error-msg">{error}</p>}
        {submitted && (
          <motion.div
            className="booking-confirmation"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <strong>Enquiry Sent!</strong>
            <span>Your enquiry has been successfully delivered to our team. We'll be in touch soon.</span>
          </motion.div>
        )}
      </form>
    </section>
  );
}

function TourBookingForm() {
  const [formData, setFormData] = useState({ from: '', to: '', date: '', pax: '', phone: '', isTourLead: true });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.from || !formData.to || !formData.date || !formData.pax || !formData.phone) {
      setError('All fields are required.');
      return;
    }
    if (formData.pax < 1) {
      setError('Pax must be a positive number.');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        setSubmitted(true);
        setFormData({ from: '', to: '', date: '', pax: '', phone: '', isTourLead: true });
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to send enquiry. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="tour-package-form" className="tour-form-wrapper">
      <div className="tour-form-header">
        <span className="tiny-label" style={{ color: 'var(--gold)' }}>Quick Lead</span>
        <h3 className="tour-form-title">Customize Tour Package.</h3>
      </div>
      <form onSubmit={handleSubmit} className="booking-form" noValidate>
        <div className="form-grid">
          <label>
            <span>From</span>
            <input type="text" name="from" value={formData.from} onChange={handleChange} required placeholder="Departure City" />
          </label>
          <label>
            <span>To</span>
            <input type="text" name="to" value={formData.to} onChange={handleChange} required placeholder="Destination" />
          </label>
          <label>
            <span>Travel Date</span>
            <input type="date" name="date" value={formData.date} onChange={handleChange} required />
          </label>
          <label>
            <span>Pax (No. of travellers)</span>
            <input type="number" min="1" name="pax" value={formData.pax} onChange={handleChange} required placeholder="e.g. 2" />
          </label>
        </div>
        <label>
          <span>Phone Number</span>
          <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="+91 98765 43210" />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Get a Quote'}
          {!loading && <ArrowRight size={19} />}
        </button>
        {error && <p className="form-error-msg">{error}</p>}
        {submitted && (
          <motion.div
            className="booking-confirmation"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <strong>Enquiry Sent!</strong>
            <span>Your tour package enquiry has been successfully delivered. We'll be in touch soon.</span>
          </motion.div>
        )}
      </form>
    </div>
  );
}

function HomeAccommodation() {
  return (
    <section className="venues page-section">
      <div className="section-heading">
        <span className="tiny-label">Stays & Events</span>
        <h2>Your space awaits.</h2>
      </div>
      <div className="venue-grid">
        <motion.article
          className="venue-tile"
          initial={{ opacity: 0, y: 42 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.64 }}
        >
          <img src={images.room1} alt="Villas" />
          <div>
            <span>Accommodation</span>
            <h3>Villas</h3>
            <p>Experience our premium Villas with private access and serene views.</p>
            <a className="tile-cta" href={pageHref('bookings')}>
              Book Now <ArrowRight size={15} />
            </a>
          </div>
        </motion.article>
        <motion.article
          className="venue-tile"
          initial={{ opacity: 0, y: 42 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.64, delay: 0.1 }}
        >
          <img src={images.bigBanquet1} alt="Grand Banquets" />
          <div>
            <span>Celebrations</span>
            <h3>Banquets</h3>
            <p>Host your celebrations in our spacious and elegant banquet halls.</p>
            <a className="tile-cta" href={pageHref('banquets')}>
              Enquire Now <ArrowRight size={15} />
            </a>
          </div>
        </motion.article>
      </div>
    </section>
  );
}

function HomeAttractions() {
  return (
    <section className="venues page-section">
      <div className="section-heading">
        <span className="tiny-label">Explore</span>
        <h2>Nearby Attractions (within 30km).</h2>
      </div>
      <div className="venue-grid" style={{ marginTop: '2rem' }}>
        <motion.article
          className="venue-tile"
          initial={{ opacity: 0, y: 42 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.64 }}
        >
          <img src={images.palace} alt="Jagatjit Palace"  />
          <div>
            <span>Heritage</span>
            <h3>Jagatjit Palace</h3>
            <p>Marvel at Kapurthala's royal French Renaissance architecture, inspired by Versailles.</p>
          </div>
        </motion.article>
        <motion.article
          className="venue-tile"
          initial={{ opacity: 0, y: 42 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.64, delay: 0.1 }}
        >
          <img src={images.mosque} alt="Moorish Mosque"  />
          <div>
            <span>Culture</span>
            <h3>Moorish Mosque</h3>
            <p>A grand elegant mosque showcasing breathtaking Moroccan architecture.</p>
          </div>
        </motion.article>
        <motion.article
          className="venue-tile"
          initial={{ opacity: 0, y: 42 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.64, delay: 0.2 }}
        >
          <img src={images.lake} alt="Kanjli Wetland"  />
          <div>
            <span>Nature</span>
            <h3>Kanjli Wetland</h3>
            <p>A peaceful and serene lake surrounded by lush green wetland nature.</p>
          </div>
        </motion.article>
        <motion.article
          className="venue-tile"
          initial={{ opacity: 0, y: 42 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.64, delay: 0.3 }}
        >
          <img src={images.gurudwara} alt="Sultanpur Lodhi"  />
          <div>
            <span>Spiritual</span>
            <h3>Sultanpur Lodhi</h3>
            <p>A historic and sacred spiritual site located just a short scenic drive away.</p>
          </div>
        </motion.article>
      </div>
    </section>
  );
}

function HomeTourPackage() {
  return (
    <section className="manifesto">
      <div className="manifesto-pin">
        <MapPin size={42} />
        <strong>City Tours</strong>
      </div>
      <div className="manifesto-list">
        <p>Customised Kapurthala City Tour Package</p>
        <div className="tour-desc">
          Experience a complete guided tour including luxury accommodation, curated food, and comfortable transport.
        </div>
        <div className="hero-actions">
          <a href="#tour-package-form">Enquire About Tours</a>
        </div>
        <TourBookingForm />
      </div>
    </section>
  );
}

function EventEnquiryForm({ defaultEventType = "Wedding" }) {
  const [formData, setFormData] = useState({ name: '', phone: '', eventType: defaultEventType, pax: '', date: '', isEventLead: true });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.pax || !formData.date) {
      setError('All fields are required.');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        setSubmitted(true);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to send enquiry. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setError('Network error. Is the server running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="home-booking page-section">
      <div className="home-booking-copy">
        <span className="tiny-label">Event Enquiry</span>
        <h2>Host your next event with us.</h2>
      </div>
      <form onSubmit={handleSubmit} className="booking-form" noValidate>
        <div className="form-grid">
          <label>
            <span>Name</span>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required placeholder="Your Name" />
          </label>
          <label>
            <span>Phone Number</span>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} required placeholder="+91 98765 43210" />
          </label>
          <label>
            <span>Event Type</span>
            <select name="eventType" value={formData.eventType} onChange={handleChange}>
              <option value="Wedding">Wedding</option>
              <option value="Reception">Reception</option>
              <option value="Corporate Event">Corporate Event</option>
              <option value="Birthday Party">Birthday Party</option>
              <option value="Kitty Party">Kitty Party</option>
              <option value="Other">Other</option>
            </select>
          </label>
          <label>
            <span>Expected Guests (Pax)</span>
            <input type="number" name="pax" value={formData.pax} onChange={handleChange} required placeholder="e.g. 150" min="1" />
          </label>
        </div>
        <label>
          <span>Preferred Date</span>
          <input type="date" name="date" value={formData.date} onChange={handleChange} required />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Submit Event Enquiry'}
          {!loading && <ArrowRight size={19} />}
        </button>
        {error && <p className="form-error-msg">{error}</p>}
        {submitted && (
          <motion.div
            className="booking-confirmation"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <strong>Enquiry Sent!</strong>
            <span>Your event enquiry has been successfully delivered. Our events team will contact you shortly.</span>
          </motion.div>
        )}
      </form>
    </section>
  );
}

function HomePage() {
  return (
    <>
      <Hero />
      <BookingSection title="Reserve your luxury stay." />
      <Intro />
      <HomeAccommodation />
      <section className="split-feature">
        <div className="split-feature-content">
          <span className="tiny-label">The Estate</span>
          <h3>A World Within Itself</h3>
          <p>Olive Green Resort & Villas spans acres of manicured landscapes, seamlessly blending luxurious architecture with natural beauty. Our estate offers a tranquil escape from the bustling city, providing a sanctuary where every corner invites you to relax.</p>
          <p>Wander through our landscaped gardens, marvel at the illuminated grand facade, and discover quiet courtyards perfect for reflection.</p>
        </div>
        <div className="split-feature-img-wrapper">
          <img src={images.aerial} alt="Resort Aerial" className="split-feature-img" />
        </div>
      </section>

      <section className="split-feature reverse" style={{ paddingBottom: "clamp(72px, 11vw, 150px)" }}>
        <div className="split-feature-content">
          <span className="tiny-label">Leisure</span>
          <h3>Endless Relaxation</h3>
          <p>Whether you are taking a refreshing dip in our crystal-clear resort pool or unwinding with a book by the olive trees, leisure is at the heart of the Olive Green experience.</p>
          <p>Our dedicated staff ensures that your time spent exploring our grounds or lounging by the poolside is completely uninterrupted and deeply rejuvenating.</p>
        </div>
        <div className="split-feature-img-wrapper">
          <img src={images.swimmingPool1} alt="Resort Pool" className="split-feature-img" />
        </div>
      </section>
      <HomeAttractions />
      <HomeTourPackage />
      <Manifesto />
    </>
  );
}

function ResortPage() {
  return (
    <>
      <PageHero
        label="About Resort / Kapurthala"
        title="A green destination with a grand address."
        copy="Rooms, villas, lawns, poolside evenings and royal interiors near Kanjli Lake."
        image={images.frontPng}
      />
      <section className="intro">
        <div className="intro-copy">
          <span className="tiny-label">Management</span>
          <h2>A message from the Managing Director.</h2>
        </div>
        <div className="intro-text">
          <p>
            "We built Olive Green to be Punjab's and Kapurthala's favourite dream destination resort. 
            Our goal is to provide luxury without noise, where every guest feels personal hospitality."
          </p>
          <p>
            <strong>— S. Sarup Singh, S. Inderpal Singh &amp; S. Ishaman Singh</strong><br/>
            <small>Managing Directors &amp; Founders</small>
          </p>
          <p>
            Olive Green Resort & Villas is proudly owned and managed by <strong>Inderpal Hospitality Pvt. Ltd.</strong>
          </p>
        </div>
      </section>

      <section className="manifesto">
        <div className="manifesto-pin">
          <Sparkles size={36} />
          <strong>Everything you need.</strong>
        </div>
        <div className="manifesto-list">
          <p>Luxury Villas</p>
          <p>Grand Banquet Halls</p>
          <p>Lush Green Lawns</p>
          <p>Swimming Pool</p>
          <p>Restaurant & Bar</p>
          <p>Kitty Hall & PDRs (Tulip, Lily)</p>
        </div>
      </section>

      <section className="intro attractions-section">
        <div className="intro-copy">
          <span className="tiny-label">Location</span>
          <h2>Accessibility &amp; Surroundings.</h2>
        </div>
        <div className="intro-text">
          <p>Located near Kanjli Lake, our resort is well-connected and exceptionally easy to reach from all major transit hubs:</p>
          <ul className="attraction-list">
            <li><strong>Railway Station:</strong> 5 mins drive</li>
            <li><strong>Bus Stand:</strong> 10 mins drive</li>
            <li><strong>Jalandhar:</strong> 30 mins drive</li>
            <li><strong>Amritsar:</strong> 1 hour drive</li>
            <li><strong>Phagwara:</strong> 40 mins drive</li>
          </ul>
          <div className="map-embed">
            <iframe
              src="https://maps.google.com/maps?q=Olive+Green+Resorts+and+Villa,Kapurthala&output=embed"
              width="100%"
              height="100%"
              style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(85%) contrast(85%)' }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Olive Green Resort Map Location"
            ></iframe>
          </div>
        </div>
      </section>

      <Testimonials category="resort" />
      <Signature />
    </>
  );
}

function VenuesPage() {
  return (
    <>
      <PageHero
        label="Venues"
        title="Banquets, lobbies and gardens built for occasion."
        copy="A focused look at the spaces that carry weddings, receptions and private events."
        image={images.bigBanquet1}
      />
      <VenueGrid />
    </>
  );
}

function DiningPage() {
  return (
    <>
      <PageHero
        label="Dining & Bar"
        title="Restaurant warmth, bar mood and event catering."
        copy="Food, drinks and lounge spaces that keep the resort alive from lunch to late evening."
        image={images.bar}
      />
      <Dining />
    </>
  );
}

function GalleryPage() {
  return (
    <>
      <PageHero
        label="Gallery"
        title="The resort in pictures."
        copy="Exterior, banquet, lobby, dining, garden and leisure moments from Olive Green."
        image={images.lobby3}
      />
      <Gallery />
    </>
  );
}

function ContactPage() {
  return (
    <>
      <PageHero
        label="Contact"
        title="Plan your visit to Olive Green."
        copy="Use the verified public details to enquire about rooms, banquets, dining or private events."
        image={images.frontPng}
      />
      <Contact />
      <HomeBookingForm />
    </>
  );
}

const allReviews = [
  { text: "Absolutely stunning property! The Villas were incredibly luxurious and private.", author: "Aman S.", category: "rooms" },
  { text: "The perfect getaway. The green surroundings and the pool made our weekend.", author: "Priya M.", category: "resort" },
  { text: "We hosted our daughter's wedding here. The Grand Banquet was magnificent.", author: "Gurpreet K.", category: "banquets" },
  { text: "Food was exquisite. The ambiance in the restaurant is truly premium.", author: "Rahul V.", category: "restaurant" },
  { text: "Great place to unwind. The bar has a fantastic selection of single malts.", author: "Vikram S.", category: "bar" },
  { text: "Our kitty party was a huge success. The staff took care of everything seamlessly.", author: "Neha G.", category: "kitty" },
  { text: "The PDR Tulip offered the most private and elegant dining experience.", author: "Sonia B.", category: "pdr" },
  { text: "Beautifully lit at night. The facade is a sight to behold.", author: "Anjali T.", category: "resort" },
  { text: "Spacious rooms with top-notch amenities. Highly recommended for families.", author: "Rakesh P.", category: "rooms" },
  { text: "The lawn attached to the banquet hall made our reception unforgettable.", author: "Simran J.", category: "banquets" },
  { text: "Every dish we ordered was flavorful and beautifully presented.", author: "Karan D.", category: "restaurant" },
  { text: "Loved the signature cocktails. The bartender knows his craft.", author: "Rohan M.", category: "bar" },
  { text: "Perfect size for a gathering of 20 friends. Kitty Hall was great.", author: "Pooja W.", category: "kitty" },
  { text: "Exceptional service in the Lily PDR. Made our anniversary very special.", author: "Amit C.", category: "pdr" },
  { text: "The resort feels like an oasis. Very peaceful and well-maintained.", author: "Harman S.", category: "resort" },
  { text: "Waking up to the pool view from the villa was the best part of our stay.", author: "Divya R.", category: "rooms" },
  { text: "Corporate offsite was handled brilliantly in the Intimate Hall.", author: "Sunil K.", category: "banquets" },
  { text: "Best dining experience in Kapurthala. The chef is a master.", author: "Manish L.", category: "restaurant" },
  { text: "A very sophisticated vibe in the lounge area.", author: "Sneha P.", category: "bar" },
  { text: "The team customized the decor for our kitty party beautifully.", author: "Ritika A.", category: "kitty" },
  { text: "The private dining room made our business lunch discreet and successful.", author: "Naveen G.", category: "pdr" },
  { text: "I can't wait to come back. The hospitality is unmatched.", author: "Tanya M.", category: "resort" },
];

function Testimonials({ category }) {
  const reviews = allReviews.filter(r => r.category === category || category === 'all').slice(0, 3);
  if (reviews.length === 0) return null;

  return (
    <section className="testimonials-section">
      <div className="section-heading">
        <span className="tiny-label">Guest Experiences</span>
        <h2>What our guests say.</h2>
      </div>
      <div className="review-grid">
        {reviews.map((review, i) => (
          <div key={i} className="review-card">
            <div className="review-stars">★★★★★</div>
            <p className="review-text">"{review.text}"</p>
            <strong className="review-author">— {review.author}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function RoomsPage() {
  return (
    <>
      <PageHero 
        label="Rooms" 
        title="Luxury Villas." 
        copy="Experience unparalleled luxury in our private Villas designed for comfort and tranquility." 
        image={images.room1} 
        action={<a className="gallery-more-btn" href={pageHref('bookings')}>Book Stay</a>}
      />
      <section className="intro">
        <div className="intro-copy">
          <span className="tiny-label">Accommodation</span>
          <h2>Your Private Sanctuary.</h2>
        </div>
        <div className="intro-text">
          <p>Our luxury Villas offer an exquisite blend of modern elegance and comforting warmth. Wake up to serene views and enjoy a space crafted for ultimate relaxation. Each room features premium bedding, bespoke furnishings, and luxury amenities to make your stay feel like a true escape.</p>
          <p>Enjoy complementary access to our grand swimming pool, manicured gardens, and exclusive resort lobbies during your stay.</p>
        </div>
      </section>

      <section className="split-feature">
        <div className="split-feature-content">
          <span className="tiny-label">The Villas</span>
          <h3>Designed for Serenity</h3>
          <p>Our luxury villas are thoughtfully designed to provide the ultimate retreat. Expansive windows let in abundant natural light, highlighting the premium bespoke furnishings and refined earthy tones that echo the natural landscape outside.</p>
          <p>Every detail, from the thread count of the linens to the ambient lighting, has been meticulously selected to ensure a restful, restorative stay.</p>
        </div>
        <div className="split-feature-img-wrapper">
          <img src={images.room2} alt="Villa Living" className="split-feature-img" />
        </div>
      </section>

      <section className="split-feature reverse">
        <div className="split-feature-content">
          <span className="tiny-label">Unmatched Comfort</span>
          <h3>A Restful Slumber</h3>
          <p>The centerpiece of every villa is the plush, king-sized bed adorned with ultra-soft, premium cotton bedding and a selection of pillows. We believe that true luxury begins with a flawless night's sleep.</p>
          <p>Wake up refreshed, draw back the blackout curtains, and step out onto your private balcony to greet the morning sun.</p>
        </div>
        <div className="split-feature-img-wrapper">
          <img src={images.room3} alt="Premium Bedding" className="split-feature-img" />
        </div>
      </section>

      <section className="split-feature">
        <div className="split-feature-content">
          <span className="tiny-label">Spacious Elegance</span>
          <h3>Room to Breathe</h3>
          <p>Beyond the bedroom, each villa features generous living and lounging areas, perfect for enjoying a morning coffee or an evening read. The seamless flow between the bedroom, living space, and en-suite luxury bathroom creates an uninterrupted aura of relaxation.</p>
        </div>
        <div className="split-feature-img-wrapper">
          <img src={images.room4} alt="Villa Interiors" className="split-feature-img" />
        </div>
      </section>

      <section className="page-section" style={{ padding: "0 clamp(20px, 5vw, 74px)" }}>
        <div className="section-heading">
          <span className="tiny-label">Gallery</span>
          <h2>A Closer Look.</h2>
        </div>
        <div className="gallery-grid" style={{ marginTop: "40px" }}>
          <button style={{ cursor: "default" }}><img src={images.room5} alt="Villa" /><span>Elegant Setup</span></button>
          <button style={{ cursor: "default" }}><img src={images.room7} alt="Villa" /><span>Comfort & Luxury</span></button>
          <button style={{ cursor: "default" }}><img src={images.room8} alt="Villa" /><span>Restful Sleep</span></button>
          <button style={{ cursor: "default" }}><img src={images.room9} alt="Villa" /><span>Room Amenities</span></button>
        </div>
      </section>

      <section className="page-section" style={{ padding: "0 clamp(20px, 5vw, 74px)", paddingBottom: "clamp(72px, 11vw, 150px)" }}>
        <div className="section-heading">
          <span className="tiny-label">Amenities</span>
          <h2>The Suite Life.</h2>
        </div>
        <div className="gallery-grid" style={{ marginTop: "40px" }}>
          <button className="wide" style={{ cursor: "default" }}><img src={images.swimmingPool2} alt="Swimming Pool" /><span>Resort Pool</span></button>
          <button style={{ cursor: "default" }}><img src={images.restroom1} alt="Luxury Restroom" /><span>Luxury Bathrooms</span></button>
          <button style={{ cursor: "default" }}><img src={images.lobby1Png} alt="Grand Lobby" /><span>Grand Lobby</span></button>
          <button className="wide" style={{ cursor: "default" }}><img src={images.swimmingPoolArea1} alt="Poolside Lounging" /><span>Poolside Lounging</span></button>
        </div>
      </section>

      <Testimonials category="rooms" />
    </>
  );
}

function BanquetsPage() {
  return (
    <>
      <PageHero label="Banquets" title="Spaces for Every Celebration." copy="Host your events in our elegant banquet halls, designed to impress." image={images.bigBanquet1} />
      <section className="intro">
        <div className="intro-copy">
          <span className="tiny-label">Events</span>
          <h2>Grandeur for Your Occasions.</h2>
        </div>
        <div className="intro-text">
          <p>We feature two exceptional banquet halls to cater to your specific event needs:</p>
          <ul className="attraction-list">
            <li><strong>Intimate Hall:</strong> Perfect for smaller gatherings, with a capacity of 200 to 300 guests. Ideal for pre-wedding functions, corporate meetings, and private parties.</li>
            <li><strong>Grand Hall &amp; Lawn:</strong> Designed for magnificent celebrations, accommodating 500 to 1400 guests. This hall opens up to our lush green lawn, offering a seamless indoor-outdoor experience for grand weddings and large-scale receptions.</li>
          </ul>
        </div>
      </section>

      <section className="split-feature">
        <div className="split-feature-content">
          <span className="tiny-label">The Grand Hall</span>
          <h3>A Canvas for Your Dreams</h3>
          <p>With its soaring ceilings, intricate chandeliers, and vast floor space, the Grand Banquet Hall is engineered to host Kapurthala's most prestigious events. The hall seamlessly integrates with the expansive outdoor lawn, providing a flawless indoor-outdoor flow for up to 1400 guests.</p>
          <p>State-of-the-art acoustics and customizable lighting ensure that your wedding reception or mega-corporate event looks and sounds spectacular.</p>
        </div>
        <div className="split-feature-img-wrapper">
          <img src={images.bigBanquet1} alt="Grand Banquet Hall" className="split-feature-img" />
        </div>
      </section>

      <section className="split-feature reverse">
        <div className="split-feature-content">
          <span className="tiny-label">The Intimate Hall</span>
          <h3>Elegance in Detail</h3>
          <p>For more personal celebrations, the Intimate Hall offers a refined, cozy atmosphere without compromising on luxury. It is the perfect canvas for Roka ceremonies, anniversary parties, and exclusive corporate retreats.</p>
          <p>Our dedicated events team will work closely with you to transform the space with custom decor, tailored seating arrangements, and personalized catering services.</p>
        </div>
        <div className="split-feature-img-wrapper">
          <img src={images.smallBanquet1} alt="Intimate Banquet Hall" className="split-feature-img" />
        </div>
      </section>

      <section className="split-feature">
        <div className="split-feature-content">
          <span className="tiny-label">Event Catering</span>
          <h3>Culinary Excellence for Crowds</h3>
          <p>A memorable event requires exceptional food. Our massive, state-of-the-art executive kitchen is fully equipped to cater to events of any scale, from intimate gatherings of 50 to grand weddings of 1400 guests.</p>
          <p>Our expert team of chefs works tirelessly behind the scenes, crafting diverse, multi-course menus that bring the rich flavors of Punjab and beyond to your guests' plates.</p>
        </div>
        <div className="split-feature-img-wrapper">
          <img src={images.kitchen1} alt="Executive Kitchen" className="split-feature-img" />
        </div>
      </section>

      <section className="page-section" style={{ padding: "0 clamp(20px, 5vw, 74px)" }}>
        <div className="section-heading">
          <span className="tiny-label">Venues</span>
          <h2>Grand Halls.</h2>
        </div>
        <div className="gallery-grid" style={{ marginTop: "40px" }}>
          <button className="wide" style={{ cursor: "default" }}><img src={images.bigBanquet2} alt="Grand Hall" /><span>Grand Banquet Hall</span></button>
          <button style={{ cursor: "default" }}><img src={images.smallBanquet1} alt="Intimate Hall" /><span>Intimate Hall</span></button>
          <button style={{ cursor: "default" }}><img src={images.smallBanquet2} alt="Intimate Hall Layout" /><span>Intimate Hall Layout</span></button>
          <button className="wide" style={{ cursor: "default" }}><img src={images.lobby3Png} alt="Pre-function Area" /><span>Pre-function Area</span></button>
        </div>
      </section>

      <EventEnquiryForm defaultEventType="Wedding" />
      <Testimonials category="banquets" />
    </>
  );
}

function RestaurantPage() {
  return (
    <>
      <PageHero label="Dining / Restaurant" title="Culinary Excellence." copy="Savor exquisite flavors in a setting of refined elegance." image={images.food} />
      <section className="intro">
        <div className="intro-copy">
          <span className="tiny-label">Dining</span>
          <h2>A Feast for the Senses.</h2>
        </div>
        <div className="intro-text">
          <p>Our restaurant offers a diverse menu of expertly crafted dishes, blending local traditions with global culinary trends. Enjoy a memorable dining experience characterized by exceptional taste and impeccable service.</p>
          <p>We take pride in our open kitchens and interactive dining spaces, allowing you to witness the culinary artistry firsthand.</p>
        </div>
      </section>

      <section className="split-feature">
        <div className="split-feature-content">
          <span className="tiny-label">The Menu</span>
          <h3>Gourmet Excellence</h3>
          <p>Our culinary team, led by our executive chef, sources only the freshest, highest-quality ingredients. Whether you are indulging in local Punjabi delicacies or exploring continental flavors, every dish is a masterpiece of taste and presentation.</p>
          <p>Vegetarian, vegan, and gluten-free options are thoughtfully integrated into our extensive menu, ensuring every guest enjoys a tailored dining experience.</p>
        </div>
        <div className="split-feature-img-wrapper">
          <img src={images.food3} alt="Gourmet Food" className="split-feature-img" />
        </div>
      </section>

      <section className="split-feature reverse">
        <div className="split-feature-content">
          <span className="tiny-label">The Setting</span>
          <h3>Dine in Style</h3>
          <p>The restaurant interior is a harmonious blend of luxurious textures and elegant lighting. With spacious seating arrangements that offer both privacy and a vibrant atmosphere, it is the perfect venue for family dinners, romantic dates, or business lunches.</p>
          <p>Large windows offer serene views of the resort's lush landscapes, bringing the beauty of the outdoors inside.</p>
        </div>
        <div className="split-feature-img-wrapper">
          <img src={images.restaurant3} alt="Restaurant Seating" className="split-feature-img" />
        </div>
      </section>

      <section className="page-section" style={{ padding: "0 clamp(20px, 5vw, 74px)", paddingBottom: "clamp(72px, 11vw, 150px)" }}>
        <div className="section-heading">
          <span className="tiny-label">Experience</span>
          <h2>Taste and Tradition.</h2>
        </div>
        <div className="gallery-grid" style={{ marginTop: "40px" }}>
          <button className="wide" style={{ cursor: "default" }}><img src={images.restaurant1} alt="Restaurant Dining" /><span>Restaurant Dining</span></button>
          <button style={{ cursor: "default" }}><img src={images.food1} alt="Signature Dish" /><span>Signature Dish</span></button>
          <button style={{ cursor: "default" }}><img src={images.food2} alt="Gourmet Menu" /><span>Gourmet Menu</span></button>
          <button className="wide" style={{ cursor: "default" }}><img src={images.kitchen1} alt="Executive Kitchen" /><span>Executive Kitchen</span></button>
          <button style={{ cursor: "default" }}><img src={images.restaurant2} alt="Intimate Seating" /><span>Intimate Seating</span></button>
          <button style={{ cursor: "default" }}><img src={images.food3} alt="Culinary Art" /><span>Culinary Art</span></button>
        </div>
      </section>

      <Testimonials category="restaurant" />
    </>
  );
}

function BarPage() {
  return (
    <>
      <PageHero label="Bar" title="Spirits and Conversations." copy="Unwind in our sophisticated bar lounge." image={images.bar} />
      <section className="intro">
        <div className="intro-copy">
          <span className="tiny-label">Lounge</span>
          <h2>Relax and Recharge.</h2>
        </div>
        <div className="intro-text">
          <p>Our bar offers a curated selection of premium spirits, signature cocktails, and fine wines. It is the perfect spot to relax after a long day or celebrate special moments with friends and colleagues.</p>
          <p>We also provide access to our exclusive Private Dining Rooms (Tulip & Lily) for those seeking a more intimate setting for their gatherings.</p>
        </div>
      </section>

      <section className="split-feature">
        <div className="split-feature-content">
          <span className="tiny-label">The Ambiance</span>
          <h3>Warmth and Elegance</h3>
          <p>The moment you step into the lounge, you are greeted by warm ambient lighting, plush seating, and an expansive wooden bar that commands the room. The decor is a masterful blend of modern chic and classic comfort, ensuring every evening spent here feels like a special occasion.</p>
          <p>Whether you prefer an intimate corner booth or a seat right at the bar, the atmosphere is designed to make you lose track of time.</p>
        </div>
        <div className="split-feature-img-wrapper">
          <img src={images.bar1} alt="Bar Lounge" className="split-feature-img" />
        </div>
      </section>

      <section className="split-feature reverse">
        <div className="split-feature-content">
          <span className="tiny-label">Mixology</span>
          <h3>Crafted to Perfection</h3>
          <p>Our expert mixologists are passionate about their craft. From classic vintage cocktails to innovative new blends featuring local herbs and premium imported spirits, every drink is poured with precision and flair.</p>
          <p>Pair your drink with our curated selection of bar bites and tapas, specifically designed to complement the bold flavors of our signature beverages.</p>
        </div>
        <div className="split-feature-img-wrapper">
          <img src={images.drinks} alt="Signature Drinks" className="split-feature-img" />
        </div>
      </section>

      <section className="page-section" style={{ padding: "0 clamp(20px, 5vw, 74px)", paddingBottom: "clamp(72px, 11vw, 150px)" }}>
        <div className="section-heading">
          <span className="tiny-label">Atmosphere</span>
          <h2>A Glimpse Inside.</h2>
        </div>
        <div className="gallery-grid" style={{ marginTop: "40px" }}>
          <button className="wide" style={{ cursor: "default" }}><img src={images.bar1} alt="Bar Lounge" /><span>Bar Lounge</span></button>
          <button style={{ cursor: "default" }}><img src={images.bar2} alt="Bar Interior" /><span>Bar Interior</span></button>
          <button style={{ cursor: "default" }}><img src={images.drinks} alt="Signature Drinks" /><span>Signature Drinks</span></button>
          <button className="wide" style={{ cursor: "default" }}><img src={images.barPDR} alt="Bar & PDR Area" /><span>Bar & PDR Area</span></button>
        </div>
      </section>

      <Testimonials category="bar" />
    </>
  );
}

function KittyHallsPage() {
  return (
    <>
      <PageHero label="Kitty Halls" title="Intimate Gatherings." copy="Perfect spaces for kitty parties and small get-togethers." image={images.kittyHall1} />
      <section className="intro">
        <div className="intro-copy">
          <span className="tiny-label">Social</span>
          <h2>Celebrate Together.</h2>
        </div>
        <div className="intro-text">
          <p>Our Kitty Halls are thoughtfully designed to host your private social events in an exclusive and intimate setting. Enjoy highly personalized service, custom-curated menus, and a vibrant atmosphere that ensures every get-together is a joyous occasion.</p>
        </div>
      </section>

      <section className="split-feature">
        <div className="split-feature-content">
          <span className="tiny-label">The Setting</span>
          <h3>Intimate and Exclusive</h3>
          <p>The Kitty Hall is an exquisite, private space tailored for smaller social gatherings, kitty parties, and exclusive family get-togethers. The sophisticated interior features plush seating, warm lighting, and elegant decor.</p>
          <p>Experience uninterrupted privacy and highly personalized service, ensuring your social event is both flawless and deeply memorable.</p>
        </div>
        <div className="split-feature-img-wrapper">
          <img src={images.kittyHall2} alt="Kitty Hall Interior" className="split-feature-img" />
        </div>
      </section>

      <section className="page-section" style={{ padding: "0 clamp(20px, 5vw, 74px)" }}>
        <div className="section-heading">
          <span className="tiny-label">Spaces</span>
          <h2>Perfectly Proportioned.</h2>
        </div>
        <div className="gallery-grid" style={{ marginTop: "40px" }}>
          <button className="wide" style={{ cursor: "default" }}><img src={images.kittyHall1} alt="Kitty Hall View" /><span>Kitty Hall</span></button>
          <button style={{ cursor: "default" }}><img src={images.kittyHall2} alt="Kitty Hall Seating" /><span>Intimate Seating</span></button>
          <button style={{ cursor: "default" }}><img src={images.food4} alt="Snacks" /><span>Chef Specials</span></button>
        </div>
      </section>

      <EventEnquiryForm defaultEventType="Kitty Party" />
      <Testimonials category="kitty" />
    </>
  );
}

function PdrsPage() {
  return (
    <>
      <PageHero label="PDRs" title="Private Dining Rooms." copy="Exclusive dining experiences in Tulip and Lily." image={images.pdr1} />
      <section className="intro">
        <div className="intro-copy">
          <span className="tiny-label">Exclusive</span>
          <h2>Tulip & Lily.</h2>
        </div>
        <div className="intro-text">
          <p>Experience the ultimate in private dining within our exclusive PDRs, Tulip and Lily. Whether it is a family dinner, a business lunch, or a romantic evening, these rooms offer privacy, dedicated service, and a bespoke culinary journey.</p>
        </div>
      </section>

      <section className="split-feature">
        <div className="split-feature-content">
          <span className="tiny-label">Bespoke Dining</span>
          <h3>Tulip & Lily</h3>
          <p>Our exclusive Private Dining Rooms, Tulip and Lily, offer a secluded haven for intimate dinners, VIP business lunches, and romantic evenings. Each room is lavishly appointed with luxurious seating and classic decor.</p>
          <p>Enjoy a dedicated waitstaff, bespoke menu curation, and direct access to our premium bar lounge, guaranteeing a dining experience that caters entirely to your pace and preferences.</p>
        </div>
        <div className="split-feature-img-wrapper">
          <img src={images.pdr2} alt="PDR Setup" className="split-feature-img" />
        </div>
      </section>

      <section className="page-section" style={{ padding: "0 clamp(20px, 5vw, 74px)" }}>
        <div className="section-heading">
          <span className="tiny-label">Private Dining</span>
          <h2>Secluded Elegance.</h2>
        </div>
        <div className="gallery-grid" style={{ marginTop: "40px" }}>
          <button className="wide" style={{ cursor: "default" }}><img src={images.pdr1} alt="PDR Interior" /><span>Tulip PDR</span></button>
          <button style={{ cursor: "default" }}><img src={images.pdr2} alt="PDR Table Setup" /><span>Lily PDR</span></button>
          <button style={{ cursor: "default" }}><img src={images.barPDR} alt="Bar & PDR" /><span>Connected Bar Access</span></button>
        </div>
      </section>

      <EventEnquiryForm defaultEventType="Corporate Event" />
      <Testimonials category="pdr" />
    </>
  );
}

function OffersPage() {
  return (
    <>
      <PageHero label="Offers" title="Exclusive Promotions." copy="Discover our latest deals for stays, dining, and more." image={images.pool} />
      <section className="venues page-section">
        <div className="section-heading">
          <span className="tiny-label">Specials</span>
          <h2>Dynamic Offers.</h2>
        </div>
        <div className="venue-grid">
          <article className="venue-tile">
            <img src={images.food} alt="Dining Offer" />
            <div>
              <span>Dining</span>
              <h3>20% Off on Food</h3>
              <p>Enjoy a 20% discount on all food and dining services during your visit this season.</p>
              <a className="tile-cta" href={pageHref('contact')}>Book Table <ArrowRight size={15} /></a>
            </div>
          </article>
          <article className="venue-tile">
            <img src={images.room1} alt="Stay Offer" />
            <div>
              <span>Accommodation</span>
              <h3>Stay 3, Pay 2</h3>
              <p>Book a 2-night stay in our luxury Villas and get the 3rd night absolutely free.</p>
              <a className="tile-cta" href={pageHref('bookings')}>Book Stay <ArrowRight size={15} /></a>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}


function CheckoutPage() {
  const data = React.useMemo(() => {
    try {
      const stored = sessionStorage.getItem('checkoutData');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  }, []);

  const [booking, setBooking] = useState(data?.booking || {});
  const selectedRoom = data?.selectedRoom;

  const [withBreakfast, setWithBreakfast] = useState(false);
  const [withExtraBed, setWithExtraBed] = useState(false);
  const [paying, setPaying] = useState(false);
  const [errors, setErrors] = useState({});
  const [successInfo, setSuccessInfo] = useState(null);

  useEffect(() => {
    if (!data) window.location.hash = '/';
  }, [data]);

  if (!data || !selectedRoom) return null;

  if (successInfo) {
    return (
      <section className="booking page-section checkout-section" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="checkout-container" style={{ textAlign: 'center' }}>
          <h2 style={{ color: 'var(--gold)', marginBottom: '16px' }}>{successInfo.title}</h2>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, maxWidth: '600px', margin: '0 auto 32px' }}>{successInfo.detail}</p>
          <button className="back-btn" style={{ padding: '12px 24px', border: '1px solid var(--gold)', borderRadius: '6px', color: 'var(--gold)' }} onClick={() => window.location.hash = '/'}>Return Home</button>
        </div>
      </section>
    );
  }

  let nights = 0;
  const arrivalDate = new Date(booking.arrival);
  const departureDate = new Date(booking.departure);
  nights = Math.round((departureDate.getTime() - arrivalDate.getTime()) / (1000 * 60 * 60 * 24));
  
  const roomSubtotal = Number(selectedRoom.base_price) * nights * Number(booking.rooms || 1);
  
  let breakfastSubtotal = 0;
  if (withBreakfast) {
    breakfastSubtotal = 1000 * nights * Number(booking.rooms || 1);
  }
  
  let extraBedSubtotal = 0;
  if (withExtraBed) {
    extraBedSubtotal = 1000 * nights * Number(booking.rooms || 1);
  }
  
  const totalAmount = roomSubtotal + breakfastSubtotal + extraBedSubtotal;

  const handlePayNow = async () => {
    setPaying(true);
    setErrors({});
    try {
      const { data: orderData, error: orderError } = await supabase.functions.invoke("create-booking-order", {
        body: {
          room_type_id: selectedRoom.id,
          check_in: booking.arrival,
          check_out: booking.departure,
          guest_name: booking.name,
          guest_email: booking.email,
          guest_phone: booking.phone,
          guests_count: Number(booking.guests || 2),
          qty: Number(booking.rooms || 1),
          notes: booking.notes,
          with_breakfast: withBreakfast,
          with_extra_bed: withExtraBed
        }
      });

      if (orderError || !orderData) {
        throw new Error(orderError?.message || "Failed to create booking order");
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Razorpay SDK failed to load. Please check your internet connection.");
      }

      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "Olive Green Resort & Villas",
        description: `Booking for ${selectedRoom.name}`,
        order_id: orderData.razorpay_order_id,
        prefill: {
          name: booking.name,
          email: booking.email,
          contact: booking.phone
        },
        handler: async (response) => {
          setPaying(true);
          try {
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke("verify-payment", {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              }
            });

            if (verifyError || !verifyData || !verifyData.success) {
              throw new Error(verifyError?.message || "Payment verification failed");
            }

            setSuccessInfo({
              title: "Booking Confirmed!",
              detail: `Your booking for ${selectedRoom.name} from ${booking.arrival} to ${booking.departure} is confirmed. Payment ID: ${response.razorpay_payment_id}.`
            });
            sessionStorage.removeItem('checkoutData');
          } catch (err) {
            console.error("Verification error:", err);
            setErrors({ submit: err.message || "Payment verification failed. Please contact support." });
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
            setErrors({ submit: "Checkout was cancelled. You can try paying again." });
          }
        },
        theme: {
          color: "#4f661f"
        }
      };

      openRazorpayCheckout(options);
    } catch (err) {
      console.error("Order creation error:", err);
      setErrors({ submit: err.message || "Failed to initiate booking payment." });
      setPaying(false);
    }
  };

  const updateBooking = (event) => {
    const { name, value } = event.target;
    setBooking((current) => ({ ...current, [name]: value }));
  };

  return (
    <section className="booking page-section checkout-section">
      <div className="checkout-container">
        <button className="back-btn" onClick={() => window.location.hash = '/'}>&larr; Back to details</button>
        
        <div className="checkout-grid">
          <div className="checkout-details">
            <h3>Order Summary</h3>
            <div className="summary-card">
              <h4>{selectedRoom.name}</h4>
              <p>{booking.rooms} Room{booking.rooms > 1 ? "s" : ""} • {booking.guests} Guest{booking.guests > 1 ? "s" : ""}</p>
              <div className="dates-row">
                <div>
                  <span className="tiny-label">Check-in</span>
                  <strong>{new Date(booking.arrival).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</strong>
                </div>
                <ArrowRight size={16} style={{ marginTop: "16px" }} />
                <div>
                  <span className="tiny-label">Check-out</span>
                  <strong>{new Date(booking.departure).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</strong>
                </div>
              </div>
            </div>

            <h3>Optional Add-ons</h3>
            <div className="meal-options">
              <label className={"meal-option " + (withBreakfast ? "selected" : "")}>
                <input type="checkbox" checked={withBreakfast} onChange={(e) => setWithBreakfast(e.target.checked)} />
                <div>
                  <strong>Morning Breakfast</strong>
                  <span>Includes morning breakfast</span>
                </div>
              </label>
              <label className={"meal-option " + (withExtraBed ? "selected" : "")}>
                <input type="checkbox" checked={withExtraBed} onChange={(e) => setWithExtraBed(e.target.checked)} />
                <div>
                  <strong>Extra Bed</strong>
                  <span>Additional bed in the room</span>
                </div>
              </label>
            </div>

            <h3>Guest Details</h3>
            <div className="guest-info-card">
              <p><strong>{booking.name}</strong></p>
              <p>{booking.email}</p>
              <p>{booking.phone}</p>
            </div>
            
            <h3>Special Requests</h3>
            <div className="guest-info-card" style={{ padding: '0', background: 'none' }}>
              <textarea name="notes" rows="3" value={booking.notes} onChange={updateBooking} placeholder="Early check-in, extra bed, dietary notes or anything the team should know." style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.1)', fontFamily: 'inherit', resize: 'vertical' }} />
            </div>
          </div>

          <div className="checkout-sidebar">
            <h3>Price Breakdown</h3>
            <div className="price-breakdown">
              <div className="price-row">
                <span>Room Charges ({nights} Night{nights > 1 ? "s" : ""})</span>
                <span>₹{roomSubtotal.toLocaleString()}</span>
              </div>
              {withBreakfast && (
                <div className="price-row">
                  <span>Breakfast Charges</span>
                  <span>₹{breakfastSubtotal.toLocaleString()}</span>
                </div>
              )}
              {withExtraBed && (
                <div className="price-row">
                  <span>Extra Bed Charges</span>
                  <span>₹{extraBedSubtotal.toLocaleString()}</span>
                </div>
              )}
              <div className="price-row total">
                <strong>Total Amount</strong>
                <strong>₹{totalAmount.toLocaleString()}</strong>
              </div>
            </div>
            
            {errors.submit && (
              <div className="form-error-msg" style={{ marginTop: "24px" }}>
                {errors.submit}
              </div>
            )}

            <button className="checkout-pay-btn" onClick={handlePayNow} disabled={paying}>
              {paying ? "Processing Securely..." : `Pay ₹${totalAmount.toLocaleString()}`}
              <ArrowRight size={19} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}


function CurrentPage({ page }) {
  const pages = {
    home: <HomePage />,
    resort: <ResortPage />,
    rooms: <RoomsPage />,
    banquets: <BanquetsPage />,
    restaurant: <RestaurantPage />,
    bar: <BarPage />,
    'kitty-halls': <KittyHallsPage />,
    pdrs: <PdrsPage />,
    offers: <OffersPage />,
    bookings: <BookingPage />,
    gallery: <GalleryPage />,
    contact: <ContactPage />,
    checkout: <CheckoutPage />
  };

  return (
    <AnimatePresence mode="wait">
      <motion.main
        key={page}
        initial={{ opacity: 0, y: 26 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      >
        {pages[page] || <HomePage />}
      </motion.main>
    </AnimatePresence>
  );
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [page, setPageState] = useState(pageFromHash);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 100, damping: 28 });
  const headerTone = useTransform(scrollYProgress, [0, 0.12], ['rgba(17, 24, 13, 0.68)', 'rgba(17, 24, 13, 0.94)']);
  const pointer = usePointer();

  const { user, profile, loading: authLoading, isAdmin, logout } = useAuth();

  const setPage = (nextPage) => {
    setPageState(nextPage);
    window.location.hash = `/${nextPage}`;
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => setLoaded(true), 2350);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      setPageState(pageFromHash());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    if (!authLoading) {
      if (page.startsWith('admin/')) {
        if (page === 'admin/login') {
          if (user && isAdmin) {
            setPage('admin/dashboard');
          }
        } else {
          if (!user || !isAdmin) {
            setPage('admin/login');
          }
        }
      }
    }
  }, [page, user, isAdmin, authLoading]);

  const isMenuOverlayAndHeaderNeeded = !page.startsWith('admin/');

  return (
    <>
      {isMenuOverlayAndHeaderNeeded && <Loader loaded={loaded} />}
      <motion.div className="cursor-dot" style={pointer} />
      {isMenuOverlayAndHeaderNeeded && <motion.div className="progress" style={{ scaleX: progress }} />}
      {loaded && isMenuOverlayAndHeaderNeeded && (
        <>
          <motion.div className="header-backdrop" style={{ backgroundColor: headerTone }} />
          <Header setMenuOpen={setMenuOpen} setPage={setPage} />
        </>
      )}
      {isMenuOverlayAndHeaderNeeded && (
        <MenuOverlay menuOpen={menuOpen} setMenuOpen={setMenuOpen} setPage={setPage} />
      )}
      
      {page.startsWith('admin/') ? (
        authLoading ? (
          <div className="admin-loading-state">
            <div className="loader-stage">
              <div className="loader-orb admin-loading-orb" />
              <div className="admin-loading-text">
                Verifying Credentials...
              </div>
            </div>
          </div>
        ) : page === 'admin/login' ? (
          <LoginPage setPage={setPage} isAdmin={isAdmin} />
        ) : !isAdmin ? (
          null
        ) : (
          <AdminLayout page={page} setPage={setPage} profile={profile} logout={logout}>
            {page === 'admin/dashboard' && <DashboardPage />}
            
            {page === 'admin/availability' && <AvailabilityPage />}
            {page === 'admin/bookings' && <BookingsPage />}
            {page === 'admin/room-types' && <RoomInfoPage />}
          </AdminLayout>
        )
      ) : (
        <CurrentPage page={page} />
      )}

      {isMenuOverlayAndHeaderNeeded && (
        <footer>
          <img src={images.logo} alt="Olive Green Resort &amp; Villas" width="88" height="44" />
          <span className="footer-address">Near Kanjli Lake, Subhanpur Road, Kapurthala</span>
          <div className="footer-contact">
            <a href="tel:+917083300001">
              <Phone size={13} />
              +91 70833 00001
            </a>
            <a href="mailto:cmd@olivegreenresortandvilla.com">
              <Sparkles size={13} />
              cmd@olivegreenresortandvilla.com
            </a>
          </div>
        </footer>
      )}
    </>
  );
}

createRoot(document.getElementById('root')).render(<App />);




