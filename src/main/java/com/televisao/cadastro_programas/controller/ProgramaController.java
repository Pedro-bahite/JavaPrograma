package com.televisao.cadastro_programas.controller;


import com.televisao.cadastro_programas.business.ProgramaService;
import com.televisao.cadastro_programas.infrastructure.entitys.Programa;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/programa")
@RequiredArgsConstructor
public class ProgramaController {

    private final ProgramaService programaService;

    @PostMapping
    public ResponseEntity<Void> salvarPrograma(@RequestBody Programa programa){
        programaService.salvarPrograma(programa);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    public ResponseEntity<Programa> buscarProgramaPorNome(@RequestParam String nome){
        return ResponseEntity.ok(programaService.buscarProgramaPorNome(nome));
    }

    @DeleteMapping
    public ResponseEntity<Void> deletarProgramaPorNome(@RequestParam String nome){
        programaService.deletarProgramaPornome(nome);
        return ResponseEntity.ok().build();
    }

    @PutMapping
    public ResponseEntity<Void> atualizarProgramaPorId(@RequestParam Integer id,
                                                       @RequestBody Programa programa){
        programaService.atualizarProgramaPorId(id, programa);
        return ResponseEntity.ok().build();
    }
}
