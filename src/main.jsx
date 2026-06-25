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
import { RoomTypesPage } from './admin/pages/RoomTypesPage';
import { AvailabilityPage } from './admin/pages/AvailabilityPage';
import { BookingsPage } from './admin/pages/BookingsPage';

const images = {
  logo: '/images/logo.png',
  frontDay: '/images/front-day.jpg',
  facade: '/images/side-evening.png',
  aerial: '/images/side-evening.png',
  banquet: '/images/big-banquet.png',
  bar: '/images/bar.png',
  food: '/images/food.png',
  golf: '/images/golf-car.png',
  lobby1: '/images/lobby-1.png',
  lobby2: '/images/lobby-2.png',
  lobby3: '/images/lobby-3.png',
  olive: '/images/olive-tree.png',
  board: '/images/roadside-board.png',
  pool: '/images/pool.png',
  poolDay: '/images/pool-day.jpg'
};

const nav = [
  { label: 'Resort', page: 'resort' },
  { label: 'Venues', page: 'venues' },
  { label: 'Dining', page: 'dining' },
  { label: 'Bookings', page: 'bookings' },
  { label: 'Gallery', page: 'gallery' },
  { label: 'Contact', page: 'contact' }
];

const heroSlides = [
  {
    image: images.frontDay,
    label: 'Arrival',
    title: 'Olive Green Resort & Villas',
    copy: 'A grand Kapurthala resort for stays, celebrations, dining and landscaped hospitality.'
  },
  {
    image: images.facade,
    label: 'Resort',
    title: 'A grand green arrival',
    copy: 'Night-lit architecture, gardens and calm hospitality near Kanjli Lake.'
  },
  {
    image: images.poolDay,
    label: 'Leisure',
    title: 'Poolside resort living',
    copy: 'Sunny water, villa stays and slower moments inside the Olive Green campus.'
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
    copy: 'A formal hall with sculpted ceilings, chandeliers, stage visibility and generous dining layouts.'
  },
  {
    title: 'Royal Lobby',
    meta: 'Arrival / Lounge / Portrait gallery',
    image: images.lobby2,
    copy: 'A long marble gallery of chandeliers, drapery and seating for arrivals that feel composed.'
  },
  {
    title: 'Restaurant & Bar',
    meta: 'Dining / Cocktails / Private hosting',
    image: images.bar,
    copy: 'A warm lounge language for dinner service, beverages and after-event conversations.'
  },
  {
    title: 'Garden Court',
    meta: 'Landscapes / Outdoor flow / Photo moments',
    image: images.aerial,
    copy: 'Illuminated gardens, fountains and wide paved courts frame the resort from day into night.'
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

const roomChoices = [
  'Resort room',
  'Villa stay',
  'Banquet enquiry',
  'Restaurant & lounge',
  'Poolside gathering'
];

const initialBooking = {
  arrival: '',
  departure: '',
  guests: '2',
  rooms: '1',
  stayType: roomChoices[0],
  name: '',
  phone: '',
  email: '',
  notes: ''
};

const gallery = [
  { image: images.frontDay, title: 'Grand front facade', area: 'Arrival' },
  { image: images.facade, title: 'Illuminated facade', area: 'Arrival' },
  { image: images.aerial, title: 'Garden court', area: 'Exterior' },
  { image: images.banquet, title: 'Grand banquet', area: 'Events' },
  { image: images.lobby2, title: 'Marble gallery', area: 'Interior' },
  { image: images.lobby3, title: 'Salon corridor', area: 'Interior' },
  { image: images.bar, title: 'Bar lounge', area: 'Dining' },
  { image: images.food, title: 'Signature plate', area: 'Dining' },
  { image: images.golf, title: 'Garden buggy', area: 'Grounds' },
  { image: images.olive, title: 'Olive tree', area: 'Landscape' },
  { image: images.poolDay, title: 'Pool courtyard', area: 'Leisure' },
  { image: images.pool, title: 'Pool at night', area: 'Leisure' },
  { image: images.board, title: 'Roadside sign', area: 'Wayfinding' }
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
  const validPages = ['home', ...nav.map((item) => item.page)];
  return validPages.includes(page) ? page : 'home';
}

function Header({ setMenuOpen, setPage }) {
  return (
    <header className="site-header">
      <a className="brand" href={pageHref('home')} onClick={() => setPage('home')} aria-label="Olive Green Resort & Villas home">
        <img src={images.logo} alt="Olive Green Resort & Villas" />
      </a>
      <nav className="desktop-nav" aria-label="Primary navigation">
        {nav.map((item) => (
          <a key={item.label} href={pageHref(item.page)} onClick={() => setPage(item.page)}>
            {item.label}
          </a>
        ))}
      </nav>
      <a className="call-link" href="tel:+917083300001">
        <Phone size={17} />
        +91 70833 00001
      </a>
      <button className="menu-button" onClick={() => setMenuOpen(true)} aria-label="Open menu">
        <Menu size={34} />
      </button>
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
      <AnimatePresence mode="wait">
        <motion.img
          key={current.image}
          src={current.image}
          alt=""
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 8.5, ease: 'easeOut' }}
        />
      </AnimatePresence>
      <div className="hero-overlay" />
      <div className="hero-panel">
        <motion.span
          className="tiny-label"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {current.label} / Kapurthala
        </motion.span>
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
        <CircleDot size={84} />
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
        <button onClick={() => setShowAll((value) => !value)}>
          {showAll ? 'Show less' : 'Show more'}
          <ArrowRight size={18} />
        </button>
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
        <img src={images.board} alt="Olive Green Resort & Villas roadside sign" />
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

function BookingPage() {
  const [booking, setBooking] = useState(initialBooking);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [paying, setPaying] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);

  const updateBooking = (event) => {
    const { name, value } = event.target;
    setBooking((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
    setSubmitted(false);
  };

  const validateBooking = () => {
    const nextErrors = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const arrival = booking.arrival ? new Date(booking.arrival) : null;
    const departure = booking.departure ? new Date(booking.departure) : null;

    if (!booking.arrival) nextErrors.arrival = 'Choose an arrival date.';
    if (!booking.departure) nextErrors.departure = 'Choose a departure date.';
    if (arrival && arrival < today) nextErrors.arrival = 'Arrival cannot be in the past.';
    if (arrival && departure && departure <= arrival) nextErrors.departure = 'Departure must be after arrival.';
    if (!booking.name.trim()) nextErrors.name = 'Enter the guest name.';
    if (!/^[0-9+\-\s()]{8,}$/.test(booking.phone.trim())) nextErrors.phone = 'Enter a valid phone number.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(booking.email.trim())) nextErrors.email = 'Enter a valid email address.';

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
        const { data, error } = await supabase.rpc('get_room_types_with_availability', {
          p_check_in: booking.arrival,
          p_check_out: booking.departure
        });

        if (error) throw error;
        setAvailableRooms(data || []);
      } catch (err) {
        console.error('Error fetching available rooms:', err);
      } finally {
        setLoadingRooms(false);
      }
    };

    fetchRooms();
  }, [booking.arrival, booking.departure]);

  useEffect(() => {
    if (availableRooms.length > 0) {
      const isStillValid = availableRooms.some(r => r.name === booking.stayType) ||
                           ['Banquet enquiry', 'Restaurant & lounge', 'Poolside gathering'].includes(booking.stayType);
      
      if (!isStillValid) {
        const firstAvailable = availableRooms.find(r => r.is_available);
        if (firstAvailable) {
          setBooking(current => ({ ...current, stayType: firstAvailable.name }));
        }
      }
    }
  }, [availableRooms]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateBooking();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) return;

    const selectedRoom = availableRooms.find(r => r.name === booking.stayType);

    if (!selectedRoom) {
      // Occasion enquiry (no online payment needed)
      setSuccessInfo({
        title: "Enquiry received.",
        detail: `We have captured your ${booking.stayType.toLowerCase()} request for ${booking.guests} guest(s). Olive Green will follow up with details.`
      });
      setSubmitted(true);
      return;
    }

    setPaying(true);
    try {
      const { data: orderData, error: orderError } = await supabase.functions.invoke('create-booking-order', {
        body: {
          room_type_id: selectedRoom.id,
          check_in: booking.arrival,
          check_out: booking.departure,
          guest_name: booking.name,
          guest_email: booking.email,
          guest_phone: booking.phone,
          qty: Number(booking.rooms || 1),
          notes: booking.notes
        }
      });

      if (orderError || !orderData) {
        throw new Error(orderError?.message || 'Failed to create booking order');
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
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
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-payment', {
              body: {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature
              }
            });

            if (verifyError || !verifyData || !verifyData.success) {
              throw new Error(verifyError?.message || 'Payment verification failed');
            }

            setSuccessInfo({
              title: "Booking Confirmed!",
              detail: `Your booking for ${selectedRoom.name} from ${booking.arrival} to ${booking.departure} is confirmed. Payment ID: ${response.razorpay_payment_id}.`
            });
            setSubmitted(true);
          } catch (err) {
            console.error('Verification error:', err);
            setErrors({ submit: err.message || 'Payment verification failed. Please contact support.' });
          } finally {
            setPaying(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPaying(false);
            setErrors({ submit: 'Checkout was cancelled. You can try paying again.' });
          }
        },
        theme: {
          color: "#4f661f"
        }
      };

      openRazorpayCheckout(options);
    } catch (err) {
      console.error('Order creation error:', err);
      setErrors({ submit: err.message || 'Failed to initiate booking payment.' });
      setPaying(false);
    }
  };

  return (
    <>
      <PageHero
        label="Bookings"
        title="Reserve the stay. Enquire for the occasion."
        copy="Share your dates, room needs and event preferences. The team can follow up with availability and details."
        image={images.pool}
      />
      <section className="booking page-section">
        <div className="booking-copy">
          <span className="tiny-label">Booking enquiry</span>
          <h2>Start with the dates.</h2>
          <p>
            This front desk form keeps the first step focused: when you arrive, how many guests are
            coming, what kind of space you need and how Olive Green should reach you.
          </p>
          <div className="booking-highlights">
            <span><CalendarDays size={18} /> Date-led request</span>
            <span><BedDouble size={18} /> Rooms, villas and venues</span>
            <span><Sparkles size={18} /> Confirmation on submit</span>
          </div>
        </div>
        <form className="booking-form" onSubmit={handleSubmit} noValidate>
          <div className="form-grid">
            <label>
              <span>Arrival</span>
              <input type="date" name="arrival" value={booking.arrival} onChange={updateBooking} />
              {errors.arrival && <small>{errors.arrival}</small>}
            </label>
            <label>
              <span>Departure</span>
              <input type="date" name="departure" value={booking.departure} onChange={updateBooking} />
              {errors.departure && <small>{errors.departure}</small>}
            </label>
            <label>
              <span>Guests</span>
              <input type="number" name="guests" min="1" max="80" value={booking.guests} onChange={updateBooking} />
            </label>
            <label>
              <span>Rooms</span>
              <input type="number" name="rooms" min="1" max="20" value={booking.rooms} onChange={updateBooking} />
            </label>
          </div>
          <label>
            <span>Stay or event type</span>
            <select name="stayType" value={booking.stayType} onChange={updateBooking} disabled={loadingRooms}>
              {loadingRooms ? (
                <option>Checking availability...</option>
              ) : availableRooms.length === 0 ? (
                roomChoices.map((choice) => (
                  <option key={choice} value={choice}>{choice}</option>
                ))
              ) : (
                <>
                  {availableRooms.map((room) => (
                    <option key={room.id} value={room.name} disabled={!room.is_available}>
                      {room.name} {room.is_available ? `(₹${Number(room.base_price).toFixed(0)} - ${room.available_units} available)` : '(Sold out)'}
                    </option>
                  ))}
                  <option disabled>--- Event Occasions ---</option>
                  <option value="Banquet enquiry">Banquet enquiry</option>
                  <option value="Restaurant & lounge">Restaurant & lounge</option>
                  <option value="Poolside gathering">Poolside gathering</option>
                </>
              )}
            </select>
          </label>
          <div className="form-grid">
            <label>
              <span>Guest name</span>
              <input type="text" name="name" value={booking.name} onChange={updateBooking} placeholder="Your name" />
              {errors.name && <small>{errors.name}</small>}
            </label>
            <label>
              <span>Phone</span>
              <input type="tel" name="phone" value={booking.phone} onChange={updateBooking} placeholder="+91 98765 43210" />
              {errors.phone && <small>{errors.phone}</small>}
            </label>
          </div>
          <label>
            <span>Email</span>
            <input type="email" name="email" value={booking.email} onChange={updateBooking} placeholder="name@example.com" />
            {errors.email && <small>{errors.email}</small>}
          </label>
          <label>
            <span>Special requests</span>
            <textarea name="notes" rows="4" value={booking.notes} onChange={updateBooking} placeholder="Early check-in, banquet setup, dietary notes or anything the team should know." />
          </label>

          {errors.submit && (
            <div className="form-error-msg">
              {errors.submit}
            </div>
          )}

          <button type="submit" disabled={paying}>
            {paying ? 'Processing Checkout...' : 'Pay & Book Now'}
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
    </>
  );
}

function PageHero({ label, title, copy, image }) {
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
        <p>{copy}</p>
      </div>
    </section>
  );
}

function HomePage() {
  return (
    <>
      <Hero />
      <Intro />
      <Manifesto />
    </>
  );
}

function ResortPage() {
  return (
    <>
      <PageHero
        label="Resort / Kapurthala"
        title="A green destination with a grand address."
        copy="Rooms, villas, lawns, poolside evenings and royal interiors near Kanjli Lake."
        image={images.frontDay}
      />
      <Intro />
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
        image={images.banquet}
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
        image={images.frontDay}
      />
      <Contact />
    </>
  );
}

function CurrentPage({ page }) {
  const pages = {
    home: <HomePage />,
    resort: <ResortPage />,
    venues: <VenuesPage />,
    dining: <DiningPage />,
    bookings: <BookingPage />,
    gallery: <GalleryPage />,
    contact: <ContactPage />
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
        {pages[page]}
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
            {page === 'admin/room-types' && <RoomTypesPage />}
            {page === 'admin/availability' && <AvailabilityPage />}
            {page === 'admin/bookings' && <BookingsPage />}
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
