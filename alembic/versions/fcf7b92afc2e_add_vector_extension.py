"""add vector extension

Revision ID: fcf7b92afc2e
Revises: 
Create Date: 2026-02-14 08:32:42.233270

"""
from alembic import op
import sqlalchemy as sa


revision = 'fcf7b92afc2e'
down_revision = None
branch_labels = None
depends_on = None


from pgvector.sqlalchemy import Vector

def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector")
    op.add_column('articles', sa.Column('embedding', Vector(768)))


def downgrade() -> None:
    op.drop_column('articles', 'embedding')
    op.execute("DROP EXTENSION IF EXISTS vector")
