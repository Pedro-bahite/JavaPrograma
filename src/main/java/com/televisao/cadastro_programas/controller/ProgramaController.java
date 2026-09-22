package com.televisao.cadastro_programas.controller;

import com.televisao.cadastro_programas.business.ProgramaService;
import com.televisao.cadastro_programas.infrastructure.entitys.Programa;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/programa")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProgramaController {

    private final ProgramaService programaService;

    @PostMapping
    public ResponseEntity<Void> salvarPrograma(@RequestBody Programa programa){
        programaService.salvarPrograma(programa);
        return ResponseEntity.ok().build();
    }


    @GetMapping
    public ResponseEntity<List<Programa>> buscarTodosProgramas(){
        return ResponseEntity.ok(programaService.buscarTodosProgramas());
    }

    // 2. Busca por NOME (GET /programa?nome=Chaves)
    @GetMapping(params = "nome")
    public ResponseEntity<Programa> buscarProgramaPorNome(@RequestParam String nome){
        return ResponseEntity.ok(programaService.buscarProgramaPorNome(nome));
    }


    @GetMapping("/{id}")
    public ResponseEntity<Programa> buscarProgramaPorId(@PathVariable Integer id){
        return ResponseEntity.ok(programaService.buscarProgramaPorId(id));
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