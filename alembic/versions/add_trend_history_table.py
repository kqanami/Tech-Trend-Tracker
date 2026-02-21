"""add trend history table

Revision ID: add_trend_history
Revises: fcf7b92afc2e
Create Date: 2024-01-15 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'add_trend_history'
down_revision = '550aec8be250'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'trend_history',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('trend_id', sa.Integer(), nullable=False),
        sa.Column('recorded_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('mention_count', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('article_count', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('repo_count', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('popularity_score', sa.Float(), nullable=True, server_default='0.0'),
        sa.Column('growth_score', sa.Float(), nullable=True, server_default='0.0'),
        sa.Column('overall_score', sa.Float(), nullable=True, server_default='0.0'),
        sa.Column('avg_sentiment', sa.Float(), nullable=True),
        sa.Column('new_mentions', sa.Integer(), nullable=True, server_default='0'),
        sa.ForeignKeyConstraint(['trend_id'], ['trends.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_trend_history_trend_date', 'trend_history', ['trend_id', 'recorded_at'], unique=False)
    op.create_index(op.f('ix_trend_history_id'), 'trend_history', ['id'], unique=False)
    op.create_index(op.f('ix_trend_history_trend_id'), 'trend_history', ['trend_id'], unique=False)
    op.create_index(op.f('ix_trend_history_recorded_at'), 'trend_history', ['recorded_at'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_trend_history_recorded_at'), table_name='trend_history')
    op.drop_index(op.f('ix_trend_history_trend_id'), table_name='trend_history')
    op.drop_index(op.f('ix_trend_history_id'), table_name='trend_history')
    op.drop_index('idx_trend_history_trend_date', table_name='trend_history')
    op.drop_table('trend_history')

