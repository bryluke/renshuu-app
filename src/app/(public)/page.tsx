import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1 className={styles.title}>Renshuu</h1>
        <p className={styles.tagline}>Track your fitness journey with ease</p>

        <div className={styles.cta}>
          <Link href="/auth" className={styles.primaryButton}>
            Get Started
          </Link>
        </div>

        <p className={styles.footer}>
          Simple nutrition tracking • Body metrics • Progress insights
        </p>
      </div>
    </main>
  );
}
