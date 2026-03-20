using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NotesApp.DTOs;
using NotesApp.Services;

namespace NotesApp.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotesController(NotesService notesService) : ControllerBase
{
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await notesService.GetAllAsync(UserId));

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var note = await notesService.GetByIdAsync(id, UserId);
        return note is null ? NotFound() : Ok(note);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateNoteRequest req)
    {
        var note = await notesService.CreateAsync(req, UserId);
        return CreatedAtAction(nameof(GetById), new { id = note.Id }, note);
    }

    [HttpPatch("{id}")]
    public async Task<IActionResult> Update(int id, UpdateNoteRequest req)
    {
        var note = await notesService.UpdateAsync(id, req, UserId);
        return note is null ? NotFound() : Ok(note);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await notesService.DeleteAsync(id, UserId);
        return deleted ? NoContent() : NotFound();
    }
}
