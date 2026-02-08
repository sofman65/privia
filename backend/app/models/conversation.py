from sqlalchemy import Index, String, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from app.core.database import Base
import uuid


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"))
    title: Mapped[str]
    # "empty" = no user messages yet, "active" = has user messages
    status: Mapped[str] = mapped_column(String, default="empty", server_default="empty")
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        default=datetime.utcnow, onupdate=datetime.utcnow
    )

    __table_args__ = (
        # Layer 4: Only one empty conversation per user at the DB level.
        # SQLite supports partial indexes via sqlite_where.
        Index(
            "ix_conversations_one_empty_per_user",
            "user_id",
            unique=True,
            sqlite_where=(status == "empty"),  # type: ignore[arg-type]
        ),
    )

    messages = relationship(
        "Message",
        back_populates="conversation",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )
