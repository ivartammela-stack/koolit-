"""add class_label to user

Revision ID: a48e060615dd
Revises: 
Create Date: 2025-10-23 22:29:00.085649

"""
from alembic import op
import sqlalchemy as sa

# NB! ära muuda revision/down_revision väärtusi, mis failis juba on

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = "a48e060615dd"
down_revision = None        # kui see on sinu esimene migratsioon
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column("user", sa.Column("class_label", sa.String(), nullable=True))

def downgrade() -> None:
    # SQLite puhul jätame eemaldamise tühjaks (vajadusel teeme hiljem batch-migratsiooni)
    pass

