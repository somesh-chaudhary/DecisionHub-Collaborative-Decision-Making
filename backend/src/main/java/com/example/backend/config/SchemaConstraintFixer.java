package com.example.backend.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class SchemaConstraintFixer {

    private static final Logger log = LoggerFactory.getLogger(SchemaConstraintFixer.class);
    private final JdbcTemplate jdbcTemplate;

    public SchemaConstraintFixer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void dropOutdatedEnumCheckConstraints() {
        try {
            jdbcTemplate.execute("ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check");
            log.info("Successfully dropped outdated notifications_type_check constraint.");
        } catch (Exception e) {
            log.warn("Could not drop notifications_type_check constraint: {}", e.getMessage());
        }

        try {
            jdbcTemplate.execute("ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_target_type_check");
            jdbcTemplate.execute("ALTER TABLE reports DROP CONSTRAINT IF EXISTS reports_status_check");
        } catch (Exception ignored) {}

        try {
            jdbcTemplate.execute("ALTER TABLE decisions ADD COLUMN IF NOT EXISTS is_discussion_locked BOOLEAN DEFAULT FALSE");
            jdbcTemplate.execute("UPDATE decisions SET is_discussion_locked = FALSE WHERE is_discussion_locked IS NULL");
        } catch (Exception e) {
            log.warn("Could not ensure is_discussion_locked column on decisions: {}", e.getMessage());
        }

        try {
            jdbcTemplate.execute("ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE");
            jdbcTemplate.execute("ALTER TABLE comments ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE");
            jdbcTemplate.execute("UPDATE comments SET is_pinned = FALSE WHERE is_pinned IS NULL");
            jdbcTemplate.execute("UPDATE comments SET is_hidden = FALSE WHERE is_hidden IS NULL");
        } catch (Exception e) {
            log.warn("Could not ensure is_pinned / is_hidden columns on comments: {}", e.getMessage());
        }

        try {
            jdbcTemplate.execute("ALTER TABLE notifications ALTER COLUMN message TYPE TEXT");
            jdbcTemplate.execute("ALTER TABLE notifications ALTER COLUMN title TYPE VARCHAR(255)");
        } catch (Exception e) {
            log.warn("Could not alter notifications columns: {}", e.getMessage());
        }

        try {
            jdbcTemplate.execute("ALTER TABLE moderation_reports ADD COLUMN IF NOT EXISTS community_id BIGINT");
            jdbcTemplate.execute("ALTER TABLE moderation_reports ADD COLUMN IF NOT EXISTS decision_id BIGINT");
            jdbcTemplate.execute("ALTER TABLE moderation_reports DROP CONSTRAINT IF EXISTS moderation_reports_target_type_check");
            jdbcTemplate.execute("ALTER TABLE moderation_reports DROP CONSTRAINT IF EXISTS moderation_reports_status_check");
        } catch (Exception e) {
            log.warn("Could not ensure moderation_reports columns: {}", e.getMessage());
        }
    }
}
