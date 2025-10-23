from alembic import context
from sqlmodel import SQLModel
from app.db.session import engine
# impordi mudelid, et metadata teaks tabeleid
from app.models import user, student, emotion  # noqa: F401
from logging.config import fileConfig

# Alembic Config objekt (.ini failist)
config = context.config

# Logging seadistus
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Metadata
target_metadata = SQLModel.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = str(engine.url)
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    connectable = engine
    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
        )
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
