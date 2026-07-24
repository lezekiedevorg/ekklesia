-- Les motifs d'absence ne concernent plus seulement le dimanche.
-- La table garde son nom historique (sunday_absences) pour éviter de casser
-- les policies RLS existantes ; elle couvre désormais tous les programmes.

ALTER TABLE sunday_absences
    ADD COLUMN IF NOT EXISTS program_type program_type NOT NULL DEFAULT 'sunday_service';

ALTER TABLE sunday_absences
    DROP CONSTRAINT IF EXISTS uq_member_sunday_absence;

ALTER TABLE sunday_absences
    ADD CONSTRAINT uq_member_absence_program UNIQUE (member_id, date, program_type);
