package com.portfolio.finance.category;

import com.portfolio.finance.category.dto.CategoryRequest;
import com.portfolio.finance.category.dto.CategoryResponse;
import com.portfolio.finance.exception.ApiError;
import com.portfolio.finance.security.AuthenticatedUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/categories")
@Tag(name = "Categorias", description = "CRUD das categorias do usuário autenticado")
@ApiResponse(responseCode = "401", description = "Token ausente ou inválido",
        content = @Content(schema = @Schema(implementation = ApiError.class)))
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    @Operation(summary = "Lista as categorias do usuário")
    public List<CategoryResponse> list(@AuthenticationPrincipal AuthenticatedUser user) {
        return categoryService.list(user.id());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Detalha uma categoria")
    @ApiResponse(responseCode = "404", description = "Categoria inexistente ou de outro usuário",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public CategoryResponse get(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser user) {
        return categoryService.get(id, user.id());
    }

    @PostMapping
    @Operation(summary = "Cria uma categoria")
    @ApiResponse(responseCode = "201", description = "Categoria criada")
    @ApiResponse(responseCode = "400", description = "Dados inválidos",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public ResponseEntity<CategoryResponse> create(@Valid @RequestBody CategoryRequest request,
                                                   @AuthenticationPrincipal AuthenticatedUser user) {
        CategoryResponse created = categoryService.create(request, user.id());
        URI location = ServletUriComponentsBuilder.fromCurrentRequest().path("/{id}")
                .buildAndExpand(created.id()).toUri();
        return ResponseEntity.created(location).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Atualiza uma categoria")
    @ApiResponse(responseCode = "404", description = "Categoria inexistente ou de outro usuário",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public CategoryResponse update(@PathVariable Long id, @Valid @RequestBody CategoryRequest request,
                                   @AuthenticationPrincipal AuthenticatedUser user) {
        return categoryService.update(id, request, user.id());
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Remove uma categoria")
    @ApiResponse(responseCode = "204", description = "Categoria removida")
    @ApiResponse(responseCode = "404", description = "Categoria inexistente ou de outro usuário",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    @ApiResponse(responseCode = "409", description = "Categoria possui lançamentos vinculados",
            content = @Content(schema = @Schema(implementation = ApiError.class)))
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal AuthenticatedUser user) {
        categoryService.delete(id, user.id());
        return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
    }
}
