import { useEffect, useState } from "react";
import { BookOpen, ClipboardCheck, FileUp, Mail, MapPin, PenTool, ShieldCheck, UserRound } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import useAuth from "../../hooks/useAuth";
import { useRoleData } from "../../hooks/useRoleData";
import { courseService } from "../../services/courseService";
import styles from "./Profile.module.css";

export default function Profile() {
  const { user } = useAuth();
  const { courses, students, assignments, quizzes } = useRoleData(user);
  const [totalMaterials, setTotalMaterials] = useState(0);

  // Fetch full details of all assigned courses to count backend materials
  useEffect(() => {
    if (courses.length === 0) return;
    let active = true;
    async function loadMaterialsCount() {
      try {
        const courseDetails = await Promise.all(
          courses.map((c) => courseService.getCourseById(c.id))
        );
        if (active) {
          const count = courseDetails.reduce((sum, courseData) => {
            const courseMats = courseData.modules?.reduce(
              (mSum, m) => mSum + (m.materials?.length || 0),
              0
            ) || 0;
            return sum + courseMats;
          }, 0);
          setTotalMaterials(count);
        }
      } catch (err) {
        console.error("Failed to load materials count for profile", err);
      }
    }
    loadMaterialsCount();
    return () => {
      active = false;
    };
  }, [courses]);

  return (
    <section className={styles.page}>
      <PageHeader 
        title="Profile" 
        subtitle="Teacher profile, branch assignment, and delivery permissions." 
      />
      
      {/* Premium Glassmorphic Hero */}
      <section className={styles.profileHero}>
        <div className={styles.profileHeroContent}>
          <div className={styles.avatarWrapper}>
            <div className={styles.profileAvatar}>{user.avatar}</div>
            <div className={styles.avatarRing} />
          </div>
          <div className={styles.heroMeta}>
            <span className={styles.roleBadge}>Teacher Faculty</span>
            <h1 className={styles.heroName}>{user.name}</h1>
            <p className={styles.heroSub}>{user.branch} Department</p>
          </div>
        </div>
      </section>

      {/* Grid Layout for Details and Stats */}
      <div className={styles.grid2}>
        
        {/* Left Panel: Teacher Details */}
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Teacher Details</h2>
          </div>
          <div className={styles.panelBody}>
            <div className={styles.profileInfoList}>
              
              <div className={styles.infoItem}>
                <span className={styles.iconWrapper}>
                  <UserRound size={18} />
                </span>
                <div className={styles.infoContent}>
                  <span className={styles.infoLabel}>Full Name</span>
                  <span className={styles.infoValue}>{user.name}</span>
                </div>
              </div>

              <div className={styles.infoItem}>
                <span className={styles.iconWrapper}>
                  <Mail size={18} />
                </span>
                <div className={styles.infoContent}>
                  <span className={styles.infoLabel}>Email Address</span>
                  <span className={styles.infoValue}>{user.email}</span>
                </div>
              </div>

              <div className={styles.infoItem}>
                <span className={styles.iconWrapper}>
                  <MapPin size={18} />
                </span>
                <div className={styles.infoContent}>
                  <span className={styles.infoLabel}>Assigned Branch</span>
                  <span className={styles.infoValue}>{user.branch}</span>
                </div>
              </div>

              <div className={styles.infoItem}>
                <span className={styles.iconWrapper}>
                  <ShieldCheck size={18} />
                </span>
                <div className={styles.infoContent}>
                  <span className={styles.infoLabel}>Role Permissions</span>
                  <span className={styles.infoValue}>Upload materials, manage assignments, quizzes, & grading</span>
                </div>
              </div>

            </div>
          </div>
        </article>

        {/* Right Panel: Workspace Summary */}
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <h2 className={styles.panelTitle}>Workspace Summary</h2>
          </div>
          <div className={styles.panelBody}>
            <div className={styles.statsGrid}>
              
              <div className={styles.statCard}>
                <span className={`${styles.statIcon} ${styles.iconBlue}`}>
                  <BookOpen size={22} />
                </span>
                <span className={styles.statValue}>{courses.length}</span>
                <span className={styles.statLabel}>Courses</span>
              </div>

              <div className={styles.statCard}>
                <span className={`${styles.statIcon} ${styles.iconGreen}`}>
                  <UserRound size={22} />
                </span>
                <span className={styles.statValue}>{students.length}</span>
                <span className={styles.statLabel}>Students</span>
              </div>

              <div className={styles.statCard}>
                <span className={`${styles.statIcon} ${styles.iconPurple}`}>
                  <FileUp size={22} />
                </span>
                <span className={styles.statValue}>{totalMaterials}</span>
                <span className={styles.statLabel}>Uploaded Files</span>
              </div>

            </div>
          </div>
        </article>

      </div>

      {/* Bottom Full-Width Stats Grid */}
      <div className={`${styles.statsGrid} ${styles.bottomRow}`}>
        
        <div className={styles.statCard}>
          <span className={`${styles.statIcon} ${styles.iconPink}`}>
            <ClipboardCheck size={22} />
          </span>
          <span className={styles.statValue}>{assignments.length}</span>
          <span className={styles.statLabel}>Assignments Mapped</span>
        </div>

        <div className={styles.statCard}>
          <span className={`${styles.statIcon} ${styles.iconAmber}`}>
            <PenTool size={22} />
          </span>
          <span className={styles.statValue}>{quizzes.length}</span>
          <span className={styles.statLabel}>Quizzes Mapped</span>
        </div>

        <div className={styles.statCard}>
          <span className={`${styles.statIcon} ${styles.iconIndigo}`}>
            <ShieldCheck size={22} />
          </span>
          <span className={styles.statValue}>Admin</span>
          <span className={styles.statLabel}>Courses are admin-controlled</span>
        </div>

      </div>
    </section>
  );
}
