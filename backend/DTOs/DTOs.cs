namespace NotesApp.DTOs;

// Auth
public record RegisterRequest(string Email, string Password, string DisplayName);
public record LoginRequest(string Email, string Password);
public record AuthResponse(string Token, string Email, string DisplayName);

// Notes
public record CreateNoteRequest(
    string Title,
    string Content,
    bool IsPinned = false,
    string Color = "#ffffff",
    List<string>? Tags = null
);

public record UpdateNoteRequest(
    string? Title,
    string? Content,
    bool? IsPinned,
    string? Color,
    List<string>? Tags
);

public record NoteResponse(
    int Id,
    string Title,
    string Content,
    bool IsPinned,
    string Color,
    ICollection<string> Tags,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
