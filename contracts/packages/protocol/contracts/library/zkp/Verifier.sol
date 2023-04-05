// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.15;

contract Verifier {
  function pairing(G1Point[] memory p1, G2Point[] memory p2)
    internal
    view
    returns (bool)
  {
    uint256 length = p1.length * 6;
    uint256[] memory input = new uint256[](length);
    uint256[1] memory result;
    bool ret;

    require(p1.length == p2.length);

    for (uint256 i = 0; i < p1.length; i++) {
      input[0 + i * 6] = p1[i].x;
      input[1 + i * 6] = p1[i].y;
      input[2 + i * 6] = p2[i].x[0];
      input[3 + i * 6] = p2[i].x[1];
      input[4 + i * 6] = p2[i].y[0];
      input[5 + i * 6] = p2[i].y[1];
    }

    assembly {
      ret := staticcall(
        gas(),
        8,
        add(input, 0x20),
        mul(length, 0x20),
        result,
        0x20
      )
    }
    require(ret);
    return result[0] != 0;
  }

  uint256 constant q_mod =
    21888242871839275222246405745257275088548364400416034343698204186575808495617;

  function fr_invert(uint256 a) internal view returns (uint256) {
    return fr_pow(a, q_mod - 2);
  }

  function fr_pow(uint256 a, uint256 power) internal view returns (uint256) {
    uint256[6] memory input;
    uint256[1] memory result;
    bool ret;

    input[0] = 32;
    input[1] = 32;
    input[2] = 32;
    input[3] = a;
    input[4] = power;
    input[5] = q_mod;

    assembly {
      ret := staticcall(gas(), 0x05, input, 0xc0, result, 0x20)
    }
    require(ret);

    return result[0];
  }

  function fr_div(uint256 a, uint256 b) internal view returns (uint256) {
    require(b != 0);
    return mulmod(a, fr_invert(b), q_mod);
  }

  function fr_mul_add(
    uint256 a,
    uint256 b,
    uint256 c
  ) internal pure returns (uint256) {
    return addmod(mulmod(a, b, q_mod), c, q_mod);
  }

  function fr_mul_add_pm(
    uint256[84] memory m,
    uint256[] calldata proof,
    uint256 opcode,
    uint256 t
  ) internal pure returns (uint256) {
    for (uint256 i = 0; i < 32; i += 2) {
      uint256 a = opcode & 0xff;
      if (a != 0xff) {
        opcode >>= 8;
        uint256 b = opcode & 0xff;
        opcode >>= 8;
        t = addmod(mulmod(proof[a], m[b], q_mod), t, q_mod);
      } else {
        break;
      }
    }

    return t;
  }

  function fr_mul_add_mt(
    uint256[84] memory m,
    uint256 base,
    uint256 opcode,
    uint256 t
  ) internal pure returns (uint256) {
    for (uint256 i = 0; i < 32; i += 1) {
      uint256 a = opcode & 0xff;
      if (a != 0xff) {
        opcode >>= 8;
        t = addmod(mulmod(base, t, q_mod), m[a], q_mod);
      } else {
        break;
      }
    }

    return t;
  }

  function fr_reverse(uint256 input) internal pure returns (uint256 v) {
    v = input;

    // swap bytes
    v =
      ((v &
        0xFF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00) >>
        8) |
      ((v &
        0x00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF00FF) <<
        8);

    // swap 2-byte long pairs
    v =
      ((v &
        0xFFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000) >>
        16) |
      ((v &
        0x0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF0000FFFF) <<
        16);

    // swap 4-byte long pairs
    v =
      ((v &
        0xFFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000) >>
        32) |
      ((v &
        0x00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF00000000FFFFFFFF) <<
        32);

    // swap 8-byte long pairs
    v =
      ((v &
        0xFFFFFFFFFFFFFFFF0000000000000000FFFFFFFFFFFFFFFF0000000000000000) >>
        64) |
      ((v &
        0x0000000000000000FFFFFFFFFFFFFFFF0000000000000000FFFFFFFFFFFFFFFF) <<
        64);

    // swap 16-byte long pairs
    v = (v >> 128) | (v << 128);
  }

  uint256 constant p_mod =
    21888242871839275222246405745257275088696311157297823662689037894645226208583;

  struct G1Point {
    uint256 x;
    uint256 y;
  }

  struct G2Point {
    uint256[2] x;
    uint256[2] y;
  }

  function ecc_from(uint256 x, uint256 y)
    internal
    pure
    returns (G1Point memory r)
  {
    r.x = x;
    r.y = y;
  }

  function ecc_add(
    uint256 ax,
    uint256 ay,
    uint256 bx,
    uint256 by
  ) internal view returns (uint256, uint256) {
    bool ret = false;
    G1Point memory r;
    uint256[4] memory input_points;

    input_points[0] = ax;
    input_points[1] = ay;
    input_points[2] = bx;
    input_points[3] = by;

    assembly {
      ret := staticcall(gas(), 6, input_points, 0x80, r, 0x40)
    }
    require(ret);

    return (r.x, r.y);
  }

  function ecc_sub(
    uint256 ax,
    uint256 ay,
    uint256 bx,
    uint256 by
  ) internal view returns (uint256, uint256) {
    return ecc_add(ax, ay, bx, p_mod - by);
  }

  function ecc_mul(
    uint256 px,
    uint256 py,
    uint256 s
  ) internal view returns (uint256, uint256) {
    uint256[3] memory input;
    bool ret = false;
    G1Point memory r;

    input[0] = px;
    input[1] = py;
    input[2] = s;

    assembly {
      ret := staticcall(gas(), 7, input, 0x60, r, 0x40)
    }
    require(ret);

    return (r.x, r.y);
  }

  function _ecc_mul_add(uint256[5] memory input) internal view {
    bool ret = false;

    assembly {
      ret := staticcall(gas(), 7, input, 0x60, add(input, 0x20), 0x40)
    }
    require(ret);

    assembly {
      ret := staticcall(
        gas(),
        6,
        add(input, 0x20),
        0x80,
        add(input, 0x60),
        0x40
      )
    }
    require(ret);
  }

  function ecc_mul_add(
    uint256 px,
    uint256 py,
    uint256 s,
    uint256 qx,
    uint256 qy
  ) internal view returns (uint256, uint256) {
    uint256[5] memory input;
    input[0] = px;
    input[1] = py;
    input[2] = s;
    input[3] = qx;
    input[4] = qy;

    _ecc_mul_add(input);

    return (input[3], input[4]);
  }

  function ecc_mul_add_pm(
    uint256[84] memory m,
    uint256[] calldata proof,
    uint256 opcode,
    uint256 t0,
    uint256 t1
  ) internal view returns (uint256, uint256) {
    uint256[5] memory input;
    input[3] = t0;
    input[4] = t1;
    for (uint256 i = 0; i < 32; i += 2) {
      uint256 a = opcode & 0xff;
      if (a != 0xff) {
        opcode >>= 8;
        uint256 b = opcode & 0xff;
        opcode >>= 8;
        input[0] = proof[a];
        input[1] = proof[a + 1];
        input[2] = m[b];
        _ecc_mul_add(input);
      } else {
        break;
      }
    }

    return (input[3], input[4]);
  }

  function update_hash_scalar(
    uint256 v,
    uint256[144] memory absorbing,
    uint256 pos
  ) internal pure {
    absorbing[pos++] = 0x02;
    absorbing[pos++] = v;
  }

  function update_hash_point(
    uint256 x,
    uint256 y,
    uint256[144] memory absorbing,
    uint256 pos
  ) internal pure {
    absorbing[pos++] = 0x01;
    absorbing[pos++] = x;
    absorbing[pos++] = y;
  }

  function to_scalar(bytes32 r) private pure returns (uint256 v) {
    uint256 tmp = uint256(r);
    tmp = fr_reverse(tmp);
    v =
      tmp %
      0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001;
  }

  function hash(uint256[144] memory absorbing, uint256 length)
    private
    view
    returns (bytes32[1] memory v)
  {
    bool success;
    assembly {
      success := staticcall(sub(gas(), 2000), 2, absorbing, length, v, 32)
      switch success
      case 0 {
        invalid()
      }
    }
    assert(success);
  }

  function squeeze_challenge(uint256[144] memory absorbing, uint32 length)
    internal
    view
    returns (uint256 v)
  {
    absorbing[length] = 0;
    bytes32 res = hash(absorbing, length * 32 + 1)[0];
    v = to_scalar(res);
    absorbing[0] = uint256(res);
    length = 1;
  }

  function get_verify_circuit_g2_s() internal pure returns (G2Point memory s) {
    s.x[0] = uint256(
      1656829060905884918855463940320617261720658144300796589605136746872661299381
    );
    s.x[1] = uint256(
      723710096057389934654532109237402371157146079633801980437987165609757153893
    );
    s.y[0] = uint256(
      11040764496980927400674360169599952883389818492248329957277618841193645691321
    );
    s.y[1] = uint256(
      9907684454269621542931723893434916820333149057832605627658035072293609883925
    );
  }

  function get_verify_circuit_g2_n() internal pure returns (G2Point memory n) {
    n.x[0] = uint256(
      11559732032986387107991004021392285783925812861821192530917403151452391805634
    );
    n.x[1] = uint256(
      10857046999023057135944570762232829481370756359578518086990519993285655852781
    );
    n.y[0] = uint256(
      17805874995975841540914202342111839520379459829704422454583296818431106115052
    );
    n.y[1] = uint256(
      13392588948715843804641432497768002650278120570034223513918757245338268106653
    );
  }

  function get_target_circuit_g2_s() internal pure returns (G2Point memory s) {
    s.x[0] = uint256(
      9259727676502123129679866410830671955715581599258253351583194035783737300016
    );
    s.x[1] = uint256(
      7405409499642135078681879774237871998731347071065355718560957222204221058540
    );
    s.y[0] = uint256(
      5578910568765567350435902168541488448117232741068706046572167980544003923455
    );
    s.y[1] = uint256(
      1342088301899780028385641495297695545068380018911112416931599216255655808692
    );
  }

  function get_target_circuit_g2_n() internal pure returns (G2Point memory n) {
    n.x[0] = uint256(
      11559732032986387107991004021392285783925812861821192530917403151452391805634
    );
    n.x[1] = uint256(
      10857046999023057135944570762232829481370756359578518086990519993285655852781
    );
    n.y[0] = uint256(
      17805874995975841540914202342111839520379459829704422454583296818431106115052
    );
    n.y[1] = uint256(
      13392588948715843804641432497768002650278120570034223513918757245338268106653
    );
  }

  function get_wx_wg(uint256[] calldata proof, uint256[4] memory instances)
    internal
    view
    returns (
      uint256,
      uint256,
      uint256,
      uint256
    )
  {
    uint256[84] memory m;
    uint256[144] memory absorbing;
    uint256 t0 = 0;
    uint256 t1 = 0;

    (t0, t1) = (
      ecc_mul(
        5053429829406704196759318828371302995431195758786255119573206826095141532748,
        17474866469369179001721984800832104572874902245124901551397782538753190686115,
        instances[0]
      )
    );
    (t0, t1) = (
      ecc_mul_add(
        19506058341311285369250950129709537001858665930781238080055694538785313190536,
        11766890011328018039114302875471275439863641833383110312773151239226451444647,
        instances[1],
        t0,
        t1
      )
    );
    (t0, t1) = (
      ecc_mul_add(
        8913897040639016655423172818861746792950819752552196088951206682312276167649,
        12901825162844846521871956315294354354166341568463865979432543535741881430053,
        instances[2],
        t0,
        t1
      )
    );
    (m[0], m[1]) = (
      ecc_mul_add(
        5161056203177707056616420210446957521476540323810176187821889010453737294713,
        12473047355262729287700030357041262877201401475211300160590281698515889076330,
        instances[3],
        t0,
        t1
      )
    );
    update_hash_scalar(
      15026129384077484248057467874652369034577217647572738202919988823514346924404,
      absorbing,
      0
    );
    update_hash_point(m[0], m[1], absorbing, 2);
    for (t0 = 0; t0 <= 4; t0++) {
      update_hash_point(
        proof[0 + t0 * 2],
        proof[1 + t0 * 2],
        absorbing,
        5 + t0 * 3
      );
    }
    m[2] = (squeeze_challenge(absorbing, 20));
    for (t0 = 0; t0 <= 13; t0++) {
      update_hash_point(
        proof[10 + t0 * 2],
        proof[11 + t0 * 2],
        absorbing,
        1 + t0 * 3
      );
    }
    m[3] = (squeeze_challenge(absorbing, 43));
    m[4] = (squeeze_challenge(absorbing, 1));
    for (t0 = 0; t0 <= 9; t0++) {
      update_hash_point(
        proof[38 + t0 * 2],
        proof[39 + t0 * 2],
        absorbing,
        1 + t0 * 3
      );
    }
    m[5] = (squeeze_challenge(absorbing, 31));
    for (t0 = 0; t0 <= 3; t0++) {
      update_hash_point(
        proof[58 + t0 * 2],
        proof[59 + t0 * 2],
        absorbing,
        1 + t0 * 3
      );
    }
    m[6] = (squeeze_challenge(absorbing, 13));
    for (t0 = 0; t0 <= 70; t0++) {
      update_hash_scalar(proof[66 + t0 * 1], absorbing, 1 + t0 * 2);
    }
    m[7] = (squeeze_challenge(absorbing, 143));
    for (t0 = 0; t0 <= 3; t0++) {
      update_hash_point(
        proof[137 + t0 * 2],
        proof[138 + t0 * 2],
        absorbing,
        1 + t0 * 3
      );
    }
    m[8] = (squeeze_challenge(absorbing, 13));
    m[9] = (
      mulmod(
        m[6],
        6143038923529407703646399695489445107254060255791852207908457597807435305312,
        q_mod
      )
    );
    m[10] = (
      mulmod(
        m[6],
        7358966525675286471217089135633860168646304224547606326237275077574224349359,
        q_mod
      )
    );
    m[11] = (
      mulmod(
        m[6],
        11377606117859914088982205826922132024839443553408109299929510653283289974216,
        q_mod
      )
    );
    m[12] = (fr_pow(m[6], 33554432));
    m[13] = (addmod(m[12], q_mod - 1, q_mod));
    m[14] = (
      mulmod(
        21888242219518804655518433051623070663413851959604507555939307129453691614729,
        m[13],
        q_mod
      )
    );
    t0 = (addmod(m[6], q_mod - 1, q_mod));
    m[14] = (fr_div(m[14], t0));
    m[15] = (
      mulmod(
        3814514741328848551622746860665626251343731549210296844380905280010844577811,
        m[13],
        q_mod
      )
    );
    t0 = (
      addmod(
        m[6],
        q_mod -
          11377606117859914088982205826922132024839443553408109299929510653283289974216,
        q_mod
      )
    );
    m[15] = (fr_div(m[15], t0));
    m[16] = (
      mulmod(
        14167635312934689395373925807699824183296350635557349457928542208657273886961,
        m[13],
        q_mod
      )
    );
    t0 = (
      addmod(
        m[6],
        q_mod -
          17329448237240114492580865744088056414251735686965494637158808787419781175510,
        q_mod
      )
    );
    m[16] = (fr_div(m[16], t0));
    m[17] = (
      mulmod(
        12609034248192017902501772617940356704925468750503023243291639149763830461639,
        m[13],
        q_mod
      )
    );
    t0 = (
      addmod(
        m[6],
        q_mod -
          16569469942529664681363945218228869388192121720036659574609237682362097667612,
        q_mod
      )
    );
    m[17] = (fr_div(m[17], t0));
    m[18] = (
      mulmod(
        12805242257443675784492534138904933930037912868081131057088370227525924812579,
        m[13],
        q_mod
      )
    );
    t0 = (
      addmod(
        m[6],
        q_mod -
          9741553891420464328295280489650144566903017206473301385034033384879943874347,
        q_mod
      )
    );
    m[18] = (fr_div(m[18], t0));
    m[19] = (
      mulmod(
        6559137297042406441428413756926584610543422337862324541665337888392460442551,
        m[13],
        q_mod
      )
    );
    t0 = (
      addmod(
        m[6],
        q_mod -
          5723528081196465413808013109680264505774289533922470433187916976440924869204,
        q_mod
      )
    );
    m[19] = (fr_div(m[19], t0));
    m[20] = (
      mulmod(
        14811589476322888753142612645486192973009181596950146578897598212834285850868,
        m[13],
        q_mod
      )
    );
    t0 = (
      addmod(
        m[6],
        q_mod -
          7358966525675286471217089135633860168646304224547606326237275077574224349359,
        q_mod
      )
    );
    m[20] = (fr_div(m[20], t0));
    t0 = (addmod(m[15], m[16], q_mod));
    t0 = (addmod(t0, m[17], q_mod));
    t0 = (addmod(t0, m[18], q_mod));
    m[15] = (addmod(t0, m[19], q_mod));
    t0 = (fr_mul_add(proof[74], proof[72], proof[73]));
    t0 = (fr_mul_add(proof[75], proof[67], t0));
    t0 = (fr_mul_add(proof[76], proof[68], t0));
    t0 = (fr_mul_add(proof[77], proof[69], t0));
    t0 = (fr_mul_add(proof[78], proof[70], t0));
    m[16] = (fr_mul_add(proof[79], proof[71], t0));
    t0 = (mulmod(proof[67], proof[68], q_mod));
    m[16] = (fr_mul_add(proof[80], t0, m[16]));
    t0 = (mulmod(proof[69], proof[70], q_mod));
    m[16] = (fr_mul_add(proof[81], t0, m[16]));
    t0 = (addmod(1, q_mod - proof[97], q_mod));
    m[17] = (mulmod(m[14], t0, q_mod));
    t0 = (mulmod(proof[100], proof[100], q_mod));
    t0 = (addmod(t0, q_mod - proof[100], q_mod));
    m[18] = (mulmod(m[20], t0, q_mod));
    t0 = (addmod(proof[100], q_mod - proof[99], q_mod));
    m[19] = (mulmod(t0, m[14], q_mod));
    m[21] = (mulmod(m[3], m[6], q_mod));
    t0 = (addmod(m[20], m[15], q_mod));
    m[15] = (addmod(1, q_mod - t0, q_mod));
    m[22] = (addmod(proof[67], m[4], q_mod));
    t0 = (fr_mul_add(proof[91], m[3], m[22]));
    m[23] = (mulmod(t0, proof[98], q_mod));
    t0 = (addmod(m[22], m[21], q_mod));
    m[22] = (mulmod(t0, proof[97], q_mod));
    m[24] = (
      mulmod(
        4131629893567559867359510883348571134090853742863529169391034518566172092834,
        m[21],
        q_mod
      )
    );
    m[25] = (addmod(proof[68], m[4], q_mod));
    t0 = (fr_mul_add(proof[92], m[3], m[25]));
    m[23] = (mulmod(t0, m[23], q_mod));
    t0 = (addmod(m[25], m[24], q_mod));
    m[22] = (mulmod(t0, m[22], q_mod));
    m[24] = (
      mulmod(
        4131629893567559867359510883348571134090853742863529169391034518566172092834,
        m[24],
        q_mod
      )
    );
    m[25] = (addmod(proof[69], m[4], q_mod));
    t0 = (fr_mul_add(proof[93], m[3], m[25]));
    m[23] = (mulmod(t0, m[23], q_mod));
    t0 = (addmod(m[25], m[24], q_mod));
    m[22] = (mulmod(t0, m[22], q_mod));
    m[24] = (
      mulmod(
        4131629893567559867359510883348571134090853742863529169391034518566172092834,
        m[24],
        q_mod
      )
    );
    t0 = (addmod(m[23], q_mod - m[22], q_mod));
    m[22] = (mulmod(t0, m[15], q_mod));
    m[21] = (
      mulmod(
        m[21],
        11166246659983828508719468090013646171463329086121580628794302409516816350802,
        q_mod
      )
    );
    m[23] = (addmod(proof[70], m[4], q_mod));
    t0 = (fr_mul_add(proof[94], m[3], m[23]));
    m[24] = (mulmod(t0, proof[101], q_mod));
    t0 = (addmod(m[23], m[21], q_mod));
    m[23] = (mulmod(t0, proof[100], q_mod));
    m[21] = (
      mulmod(
        4131629893567559867359510883348571134090853742863529169391034518566172092834,
        m[21],
        q_mod
      )
    );
    m[25] = (addmod(proof[71], m[4], q_mod));
    t0 = (fr_mul_add(proof[95], m[3], m[25]));
    m[24] = (mulmod(t0, m[24], q_mod));
    t0 = (addmod(m[25], m[21], q_mod));
    m[23] = (mulmod(t0, m[23], q_mod));
    m[21] = (
      mulmod(
        4131629893567559867359510883348571134090853742863529169391034518566172092834,
        m[21],
        q_mod
      )
    );
    m[25] = (addmod(proof[66], m[4], q_mod));
    t0 = (fr_mul_add(proof[96], m[3], m[25]));
    m[24] = (mulmod(t0, m[24], q_mod));
    t0 = (addmod(m[25], m[21], q_mod));
    m[23] = (mulmod(t0, m[23], q_mod));
    m[21] = (
      mulmod(
        4131629893567559867359510883348571134090853742863529169391034518566172092834,
        m[21],
        q_mod
      )
    );
    t0 = (addmod(m[24], q_mod - m[23], q_mod));
    m[21] = (mulmod(t0, m[15], q_mod));
    t0 = (addmod(proof[104], m[3], q_mod));
    m[23] = (mulmod(proof[103], t0, q_mod));
    t0 = (addmod(proof[106], m[4], q_mod));
    m[23] = (mulmod(m[23], t0, q_mod));
    m[24] = (mulmod(proof[67], proof[82], q_mod));
    m[2] = (mulmod(0, m[2], q_mod));
    m[24] = (addmod(m[2], m[24], q_mod));
    m[25] = (addmod(m[2], proof[83], q_mod));
    m[26] = (addmod(proof[104], q_mod - proof[106], q_mod));
    t0 = (addmod(1, q_mod - proof[102], q_mod));
    m[27] = (mulmod(m[14], t0, q_mod));
    t0 = (mulmod(proof[102], proof[102], q_mod));
    t0 = (addmod(t0, q_mod - proof[102], q_mod));
    m[28] = (mulmod(m[20], t0, q_mod));
    t0 = (addmod(m[24], m[3], q_mod));
    m[24] = (mulmod(proof[102], t0, q_mod));
    m[25] = (addmod(m[25], m[4], q_mod));
    t0 = (mulmod(m[24], m[25], q_mod));
    t0 = (addmod(m[23], q_mod - t0, q_mod));
    m[23] = (mulmod(t0, m[15], q_mod));
    m[24] = (mulmod(m[14], m[26], q_mod));
    t0 = (addmod(proof[104], q_mod - proof[105], q_mod));
    t0 = (mulmod(m[26], t0, q_mod));
    m[26] = (mulmod(t0, m[15], q_mod));
    t0 = (addmod(proof[109], m[3], q_mod));
    m[29] = (mulmod(proof[108], t0, q_mod));
    t0 = (addmod(proof[111], m[4], q_mod));
    m[29] = (mulmod(m[29], t0, q_mod));
    m[30] = (fr_mul_add(proof[82], proof[68], m[2]));
    m[31] = (addmod(proof[109], q_mod - proof[111], q_mod));
    t0 = (addmod(1, q_mod - proof[107], q_mod));
    m[32] = (mulmod(m[14], t0, q_mod));
    t0 = (mulmod(proof[107], proof[107], q_mod));
    t0 = (addmod(t0, q_mod - proof[107], q_mod));
    m[33] = (mulmod(m[20], t0, q_mod));
    t0 = (addmod(m[30], m[3], q_mod));
    t0 = (mulmod(proof[107], t0, q_mod));
    t0 = (mulmod(t0, m[25], q_mod));
    t0 = (addmod(m[29], q_mod - t0, q_mod));
    m[29] = (mulmod(t0, m[15], q_mod));
    m[30] = (mulmod(m[14], m[31], q_mod));
    t0 = (addmod(proof[109], q_mod - proof[110], q_mod));
    t0 = (mulmod(m[31], t0, q_mod));
    m[31] = (mulmod(t0, m[15], q_mod));
    t0 = (addmod(proof[114], m[3], q_mod));
    m[34] = (mulmod(proof[113], t0, q_mod));
    t0 = (addmod(proof[116], m[4], q_mod));
    m[34] = (mulmod(m[34], t0, q_mod));
    m[35] = (fr_mul_add(proof[82], proof[69], m[2]));
    m[36] = (addmod(proof[114], q_mod - proof[116], q_mod));
    t0 = (addmod(1, q_mod - proof[112], q_mod));
    m[37] = (mulmod(m[14], t0, q_mod));
    t0 = (mulmod(proof[112], proof[112], q_mod));
    t0 = (addmod(t0, q_mod - proof[112], q_mod));
    m[38] = (mulmod(m[20], t0, q_mod));
    t0 = (addmod(m[35], m[3], q_mod));
    t0 = (mulmod(proof[112], t0, q_mod));
    t0 = (mulmod(t0, m[25], q_mod));
    t0 = (addmod(m[34], q_mod - t0, q_mod));
    m[34] = (mulmod(t0, m[15], q_mod));
    m[35] = (mulmod(m[14], m[36], q_mod));
    t0 = (addmod(proof[114], q_mod - proof[115], q_mod));
    t0 = (mulmod(m[36], t0, q_mod));
    m[36] = (mulmod(t0, m[15], q_mod));
    t0 = (addmod(proof[119], m[3], q_mod));
    m[39] = (mulmod(proof[118], t0, q_mod));
    t0 = (addmod(proof[121], m[4], q_mod));
    m[39] = (mulmod(m[39], t0, q_mod));
    m[40] = (fr_mul_add(proof[82], proof[70], m[2]));
    m[41] = (addmod(proof[119], q_mod - proof[121], q_mod));
    t0 = (addmod(1, q_mod - proof[117], q_mod));
    m[42] = (mulmod(m[14], t0, q_mod));
    t0 = (mulmod(proof[117], proof[117], q_mod));
    t0 = (addmod(t0, q_mod - proof[117], q_mod));
    m[43] = (mulmod(m[20], t0, q_mod));
    t0 = (addmod(m[40], m[3], q_mod));
    t0 = (mulmod(proof[117], t0, q_mod));
    t0 = (mulmod(t0, m[25], q_mod));
    t0 = (addmod(m[39], q_mod - t0, q_mod));
    m[25] = (mulmod(t0, m[15], q_mod));
    m[39] = (mulmod(m[14], m[41], q_mod));
    t0 = (addmod(proof[119], q_mod - proof[120], q_mod));
    t0 = (mulmod(m[41], t0, q_mod));
    m[40] = (mulmod(t0, m[15], q_mod));
    t0 = (addmod(proof[124], m[3], q_mod));
    m[41] = (mulmod(proof[123], t0, q_mod));
    t0 = (addmod(proof[126], m[4], q_mod));
    m[41] = (mulmod(m[41], t0, q_mod));
    m[44] = (fr_mul_add(proof[84], proof[67], m[2]));
    m[45] = (addmod(m[2], proof[85], q_mod));
    m[46] = (addmod(proof[124], q_mod - proof[126], q_mod));
    t0 = (addmod(1, q_mod - proof[122], q_mod));
    m[47] = (mulmod(m[14], t0, q_mod));
    t0 = (mulmod(proof[122], proof[122], q_mod));
    t0 = (addmod(t0, q_mod - proof[122], q_mod));
    m[48] = (mulmod(m[20], t0, q_mod));
    t0 = (addmod(m[44], m[3], q_mod));
    m[44] = (mulmod(proof[122], t0, q_mod));
    t0 = (addmod(m[45], m[4], q_mod));
    t0 = (mulmod(m[44], t0, q_mod));
    t0 = (addmod(m[41], q_mod - t0, q_mod));
    m[41] = (mulmod(t0, m[15], q_mod));
    m[44] = (mulmod(m[14], m[46], q_mod));
    t0 = (addmod(proof[124], q_mod - proof[125], q_mod));
    t0 = (mulmod(m[46], t0, q_mod));
    m[45] = (mulmod(t0, m[15], q_mod));
    t0 = (addmod(proof[129], m[3], q_mod));
    m[46] = (mulmod(proof[128], t0, q_mod));
    t0 = (addmod(proof[131], m[4], q_mod));
    m[46] = (mulmod(m[46], t0, q_mod));
    m[49] = (fr_mul_add(proof[86], proof[67], m[2]));
    m[50] = (addmod(m[2], proof[87], q_mod));
    m[51] = (addmod(proof[129], q_mod - proof[131], q_mod));
    t0 = (addmod(1, q_mod - proof[127], q_mod));
    m[52] = (mulmod(m[14], t0, q_mod));
    t0 = (mulmod(proof[127], proof[127], q_mod));
    t0 = (addmod(t0, q_mod - proof[127], q_mod));
    m[53] = (mulmod(m[20], t0, q_mod));
    t0 = (addmod(m[49], m[3], q_mod));
    m[49] = (mulmod(proof[127], t0, q_mod));
    t0 = (addmod(m[50], m[4], q_mod));
    t0 = (mulmod(m[49], t0, q_mod));
    t0 = (addmod(m[46], q_mod - t0, q_mod));
    m[46] = (mulmod(t0, m[15], q_mod));
    m[49] = (mulmod(m[14], m[51], q_mod));
    t0 = (addmod(proof[129], q_mod - proof[130], q_mod));
    t0 = (mulmod(m[51], t0, q_mod));
    m[50] = (mulmod(t0, m[15], q_mod));
    t0 = (addmod(proof[134], m[3], q_mod));
    m[51] = (mulmod(proof[133], t0, q_mod));
    t0 = (addmod(proof[136], m[4], q_mod));
    m[51] = (mulmod(m[51], t0, q_mod));
    m[54] = (fr_mul_add(proof[88], proof[67], m[2]));
    m[2] = (addmod(m[2], proof[89], q_mod));
    m[55] = (addmod(proof[134], q_mod - proof[136], q_mod));
    t0 = (addmod(1, q_mod - proof[132], q_mod));
    m[56] = (mulmod(m[14], t0, q_mod));
    t0 = (mulmod(proof[132], proof[132], q_mod));
    t0 = (addmod(t0, q_mod - proof[132], q_mod));
    m[20] = (mulmod(m[20], t0, q_mod));
    t0 = (addmod(m[54], m[3], q_mod));
    m[3] = (mulmod(proof[132], t0, q_mod));
    t0 = (addmod(m[2], m[4], q_mod));
    t0 = (mulmod(m[3], t0, q_mod));
    t0 = (addmod(m[51], q_mod - t0, q_mod));
    m[2] = (mulmod(t0, m[15], q_mod));
    m[3] = (mulmod(m[14], m[55], q_mod));
    t0 = (addmod(proof[134], q_mod - proof[135], q_mod));
    t0 = (mulmod(m[55], t0, q_mod));
    m[4] = (mulmod(t0, m[15], q_mod));
    t0 = (fr_mul_add(m[5], 0, m[16]));
    t0 = (
      fr_mul_add_mt(
        m,
        m[5],
        24064768791442479290152634096194013545513974547709823832001394403118888981009,
        t0
      )
    );
    t0 = (fr_mul_add_mt(m, m[5], 4704208815882882920750, t0));
    m[2] = (fr_div(t0, m[13]));
    m[3] = (mulmod(m[8], m[8], q_mod));
    m[4] = (mulmod(m[3], m[8], q_mod));
    (t0, t1) = (ecc_mul(proof[143], proof[144], m[4]));
    (t0, t1) = (ecc_mul_add_pm(m, proof, 281470825071501, t0, t1));
    (m[14], m[15]) = (ecc_add(t0, t1, proof[137], proof[138]));
    m[5] = (mulmod(m[4], m[11], q_mod));
    m[11] = (mulmod(m[4], m[7], q_mod));
    m[13] = (mulmod(m[11], m[7], q_mod));
    m[16] = (mulmod(m[13], m[7], q_mod));
    m[17] = (mulmod(m[16], m[7], q_mod));
    m[18] = (mulmod(m[17], m[7], q_mod));
    m[19] = (mulmod(m[18], m[7], q_mod));
    t0 = (mulmod(m[19], proof[135], q_mod));
    t0 = (fr_mul_add_pm(m, proof, 79227007564587019091207590530, t0));
    m[20] = (fr_mul_add(proof[105], m[4], t0));
    m[10] = (mulmod(m[3], m[10], q_mod));
    m[20] = (fr_mul_add(proof[99], m[3], m[20]));
    m[9] = (mulmod(m[8], m[9], q_mod));
    m[21] = (mulmod(m[8], m[7], q_mod));
    for (t0 = 0; t0 < 8; t0++) {
      m[22 + t0 * 1] = (mulmod(m[21 + t0 * 1], m[7 + t0 * 0], q_mod));
    }
    t0 = (mulmod(m[29], proof[133], q_mod));
    t0 = (
      fr_mul_add_pm(
        m,
        proof,
        1461480058012745347196003969984389955172320353408,
        t0
      )
    );
    m[20] = (addmod(m[20], t0, q_mod));
    m[3] = (addmod(m[3], m[21], q_mod));
    m[21] = (mulmod(m[7], m[7], q_mod));
    m[30] = (mulmod(m[21], m[7], q_mod));
    for (t0 = 0; t0 < 50; t0++) {
      m[31 + t0 * 1] = (mulmod(m[30 + t0 * 1], m[7 + t0 * 0], q_mod));
    }
    m[81] = (mulmod(m[80], proof[90], q_mod));
    m[82] = (mulmod(m[79], m[12], q_mod));
    m[83] = (mulmod(m[82], m[12], q_mod));
    m[12] = (mulmod(m[83], m[12], q_mod));
    t0 = (fr_mul_add(m[79], m[2], m[81]));
    t0 = (
      fr_mul_add_pm(
        m,
        proof,
        28637501128329066231612878461967933875285131620580756137874852300330784214624,
        t0
      )
    );
    t0 = (
      fr_mul_add_pm(
        m,
        proof,
        21474593857386732646168474467085622855647258609351047587832868301163767676495,
        t0
      )
    );
    t0 = (
      fr_mul_add_pm(
        m,
        proof,
        14145600374170319983429588659751245017860232382696106927048396310641433325177,
        t0
      )
    );
    t0 = (fr_mul_add_pm(m, proof, 18446470583433829957, t0));
    t0 = (addmod(t0, proof[66], q_mod));
    m[2] = (addmod(m[20], t0, q_mod));
    m[19] = (addmod(m[19], m[54], q_mod));
    m[20] = (addmod(m[29], m[53], q_mod));
    m[18] = (addmod(m[18], m[51], q_mod));
    m[28] = (addmod(m[28], m[50], q_mod));
    m[17] = (addmod(m[17], m[48], q_mod));
    m[27] = (addmod(m[27], m[47], q_mod));
    m[16] = (addmod(m[16], m[45], q_mod));
    m[26] = (addmod(m[26], m[44], q_mod));
    m[13] = (addmod(m[13], m[42], q_mod));
    m[25] = (addmod(m[25], m[41], q_mod));
    m[11] = (addmod(m[11], m[39], q_mod));
    m[24] = (addmod(m[24], m[38], q_mod));
    m[4] = (addmod(m[4], m[36], q_mod));
    m[23] = (addmod(m[23], m[35], q_mod));
    m[22] = (addmod(m[22], m[34], q_mod));
    m[3] = (addmod(m[3], m[33], q_mod));
    m[8] = (addmod(m[8], m[32], q_mod));
    (t0, t1) = (ecc_mul(proof[143], proof[144], m[5]));
    (t0, t1) = (
      ecc_mul_add_pm(
        m,
        proof,
        10933423423422768024429730621579321771439401845242250760130969989159573132066,
        t0,
        t1
      )
    );
    (t0, t1) = (
      ecc_mul_add_pm(
        m,
        proof,
        1461486238301980199876269201563775120819706402602,
        t0,
        t1
      )
    );
    (t0, t1) = (
      ecc_mul_add(
        9736927962205137731687241044156378747644419181030567136203799034899514141043,
        9318115852090880107786972001905951584711464588155761214637953234485186061733,
        m[78],
        t0,
        t1
      )
    );
    (t0, t1) = (
      ecc_mul_add(
        19311825302446276835253296934522943695692587008635600421633578625858090408687,
        914536939090458301121453582678562985672602132817981100200573262526387184264,
        m[77],
        t0,
        t1
      )
    );
    (t0, t1) = (
      ecc_mul_add(
        5124470691753736999740838703925493320714571574945861394366741717548739876380,
        10987639393497586032588204942054347341345301024634438315266853943416335644116,
        m[76],
        t0,
        t1
      )
    );
    (t0, t1) = (
      ecc_mul_add(
        8627540057447709575102724402452819284771384749474666929954164574554775959346,
        16172546999626351137457922405582211402357837937211036394680891117264961347223,
        m[75],
        t0,
        t1
      )
    );
    (t0, t1) = (
      ecc_mul_add(
        12206633097463748858189847478514229204409466721900940004783088375719614811086,
        1294388318221849887520814088865212363682689070250529045567997000277552602156,
        m[74],
        t0,
        t1
      )
    );
    (t0, t1) = (
      ecc_mul_add(
        9144703262347631364093650996887643753011757166424462537137954237264982857888,
        1315360532488305402245048820985945082751659919423487018782600505247936271243,
        m[73],
        t0,
        t1
      )
    );
    (t0, t1) = (
      ecc_mul_add(
        17068414202322176329367877432276411819550674933953723681795175415639334076961,
        10570984703632055382646327230777256388360816928238315397023077164238268786761,
        m[72],
        t0,
        t1
      )
    );
    (t0, t1) = (
      ecc_mul_add(
        18397095603128447589298354683920450407708992309163856408562094849804140831317,
        16697715193725887850909142742058778353261429726045380169913596044705641385636,
        m[71],
        t0,
        t1
      )
    );
    (t0, t1) = (
      ecc_mul_add(
        13439597884573318043627723069547870769811141413252804842019845373518673011531,
        19248103593061747407247966751078898715964545660156011025513199700049889454070,
        m[70],
        t0,
        t1
      )
    );
    (t0, t1) = (
      ecc_mul_add(
        4297995858558484519789255638413892408353323181073578165337929328123650809932,
        4023857874273940282069311102148568232450482070279063914405883144928951468416,
        m[69],
        t0,
        t1
      )
    );
    (t0, t1) = (
      ecc_mul_add(
        17068414202322176329367877432276411819550674933953723681795175415639334076961,
        10570984703632055382646327230777256388360816928238315397023077164238268786761,
        m[68],
        t0,
        t1
      )
    );
    (t0, t1) = (
      ecc_mul_add(
        15998128192210187603384860082796101340998830486631072032818999359515266707583,
        19628492777988278255709139461764616641763944511798748743696270158137601507648,
        m[67],
        t0,
        t1
      )
    );
    (t0, t1) = (
      ecc_mul_add(
        20423358786843390596522309548661081095453012267122089459885228971055040732305,
        14101872199671241103481890077502495238876057075810413167116465190613047515348,
        m[66],
        t0,
        t1
      )
    );
    (t0, t1) = (
      ecc_mul_add(
        18672403910599169306701925963893736233512189005597073795976810653103375798764,
        10230798330328686653782180383472375322555205036290117557913075080169718724352,
        m[65],
        t0,
        t1
      )
    );
    (t0, t1) = (
      ecc_mul_add(
        7413125225988597843331887740865889498068523174048514881354539901391702738857,
        18051341347708571935677400847598350369848924782365976430142151318034133892730,
        m[64],
        t0,
        t1
      )
    );
    (t0, t1) = (
      ecc_mul_add(
        8781706713775115509362427833113676841052545598209035224313869425347480010875,
        12025567450430193697697554899454001856410141432648405745679342818189722374676,
        m[63],
        t0,
        t1
      )
    );
    (t0, t1) = (
      ecc_mul_add(
        6504692970247002589012393891320216606974856290103546021419712279980703059582,
        16192918631890987027208648388198844923616193815763641659875185739962751994682,
        m[62],
        t0,
        t1
      )
    );
    (t0, t1) = (
      ecc_mul_add(
        17495760671580470279306920455488532669247116654104207776403459383350751518320,
        18372808207291319651102420682242713485851532978698836702604368169518858973469,
        m[61],
        t0,
        t1
      )
    );
    (t0, t1) = (
      ecc_mul_add(
        4094501773836422379719513238393288624129772272429624891831624358103108613942,
        15537481721004487921328373110391221740649360308937983387970216793855333674895,
        m[60],
        t0,
        t1
      )
    );
    (t0, t1) = (
      ecc_mul_add(
        2942039347793696324330962142875026950053391561282756811543840903132532162962,
        17704976189403549679982613305140857525722471800722050852277680179598037517580,
        m[59],
        t0,
        t1
      )
    );
    (t0, t1) = (
      ecc_mul_add(
        18473170003736271405749352657293113317022579363454022946446622965682112328073,
        1756608558135240572538109544634692538541307680817678424944749367998688414938,
        m[58],
        t0,
        t1
      )
    );
    (t0, t1) = (
      ecc_mul_add(
        20744018310114553976975341979719735727393809311153425792921565320316969372489,
        2084657537173773755882407112163958226466572947232599139356741383073538008375,
        m[57],
        t0,
        t1
      )
    );
    (t0, t1) = (
      ecc_mul_add(
        19616999786615867377208622827597764032055506626001337213886561678059214178767,
        5689698621897196528831748048439734813758834762271368813435876256958994976937,
        m[56],
        t0,
        t1
      )
    );
    (t0, t1) = (
      ecc_mul_add_pm(
        m,
        proof,
        6277008573546246765208814532330797927747086570010716419876,
        t0,
        t1
      )
    );
    (m[0], m[1]) = (ecc_add(t0, t1, m[0], m[1]));
    (t0, t1) = (ecc_mul(1, 2, m[2]));
    (m[0], m[1]) = (ecc_sub(m[0], m[1], t0, t1));
    return (m[14], m[15], m[0], m[1]);
  }

  function verify(
    uint256[] calldata proof,
    uint256[] calldata target_circuit_final_pair
  ) public view {
    uint256[4] memory instances;
    instances[0] = target_circuit_final_pair[0] & ((1 << 136) - 1);
    instances[1] =
      (target_circuit_final_pair[0] >> 136) +
      ((target_circuit_final_pair[1] & 1) << 136);
    instances[2] = target_circuit_final_pair[2] & ((1 << 136) - 1);
    instances[3] =
      (target_circuit_final_pair[2] >> 136) +
      ((target_circuit_final_pair[3] & 1) << 136);

    uint256 x0 = 0;
    uint256 x1 = 0;
    uint256 y0 = 0;
    uint256 y1 = 0;

    G1Point[] memory g1_points = new G1Point[](2);
    G2Point[] memory g2_points = new G2Point[](2);
    bool checked = false;

    (x0, y0, x1, y1) = get_wx_wg(proof, instances);
    g1_points[0].x = x0;
    g1_points[0].y = y0;
    g1_points[1].x = x1;
    g1_points[1].y = y1;
    g2_points[0] = get_verify_circuit_g2_s();
    g2_points[1] = get_verify_circuit_g2_n();

    checked = pairing(g1_points, g2_points);
    require(checked);

    g1_points[0].x = target_circuit_final_pair[0];
    g1_points[0].y = target_circuit_final_pair[1];
    g1_points[1].x = target_circuit_final_pair[2];
    g1_points[1].y = target_circuit_final_pair[3];
    g2_points[0] = get_target_circuit_g2_s();
    g2_points[1] = get_target_circuit_g2_n();

    checked = pairing(g1_points, g2_points);
    require(checked);
  }
}
