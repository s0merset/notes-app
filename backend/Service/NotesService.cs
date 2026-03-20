using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using NotesApp.Data;
using NotesApp.DTOs;
using NotesApp.Models;

namespace NotesApp.Services;

public class NotesService(AppDbContext db, IDistributedCache cache)
{
    private string CacheKey(int userId) => $"notes:user:{userId}";

    public async Task<List<NoteResponse>> GetAllAsync(int userId)
    {
        var key = CacheKey(userId);
        var cached = await cache.GetStringAsync(key);
        if (cached is not null)
            return JsonSerializer.Deserialize<List<NoteResponse>>(cached)!;

        var notes = await db.Notes
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.IsPinned)
            .ThenByDescending(n => n.UpdatedAt)
            .Select(n => ToResponse(n))
            .ToListAsync();

        await cache.SetStringAsync(key, JsonSerializer.Serialize(notes),
            new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(5)
            });

        return notes;
    }

    public async Task<NoteResponse?> GetByIdAsync(int id, int userId)
    {
        var note = await db.Notes.FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);
        return note is null ? null : ToResponse(note);
    }

    public async Task<NoteResponse> CreateAsync(CreateNoteRequest req, int userId)
    {
        var note = new Note
        {
            Title = req.Title,
            Content = req.Content,
            IsPinned = req.IsPinned,
            Color = req.Color,
            Tags = req.Tags ?? [],
            UserId = userId
        };

        db.Notes.Add(note);
        await db.SaveChangesAsync();
        await cache.RemoveAsync(CacheKey(userId));
        return ToResponse(note);
    }

    public async Task<NoteResponse?> UpdateAsync(int id, UpdateNoteRequest req, int userId)
    {
        var note = await db.Notes.FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);
        if (note is null) return null;

        if (req.Title is not null) note.Title = req.Title;
        if (req.Content is not null) note.Content = req.Content;
        if (req.IsPinned is not null) note.IsPinned = req.IsPinned.Value;
        if (req.Color is not null) note.Color = req.Color;
        if (req.Tags is not null) note.Tags = req.Tags;
        note.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        await cache.RemoveAsync(CacheKey(userId));
        return ToResponse(note);
    }

    public async Task<bool> DeleteAsync(int id, int userId)
    {
        var note = await db.Notes.FirstOrDefaultAsync(n => n.Id == id && n.UserId == userId);
        if (note is null) return false;

        db.Notes.Remove(note);
        await db.SaveChangesAsync();
        await cache.RemoveAsync(CacheKey(userId));
        return true;
    }

    private static NoteResponse ToResponse(Note n) =>
        new(n.Id, n.Title, n.Content, n.IsPinned, n.Color, n.Tags, n.CreatedAt, n.UpdatedAt);
}
