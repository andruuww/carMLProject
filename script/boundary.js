class Boundary {
  constructor(x1, y1, x2, y2) {
    this.a = createVector(x1, y1);
    this.b = createVector(x2, y2);
    this.end = false;
  }

  show() {
    push();
    stroke(255);
    if (this.end) {
      stroke(255, 255, 0);
    }

    line(this.a.x, this.a.y, this.b.x, this.b.y);
    pop();
  }

  middle() {
    return createVector((this.a.x + this.b.x) * 0.5, (this.a.y + this.b.y) * 0.5)
  }

  speedPoint() {
    let optimalPoint = createVector((this.middle().x + this.a.x) * 0.5, (this.middle().y + this.a.y) * 0.5);
    let center = createVector(width / 2, height / 2,)
    let fromCenter = p5.Vector.dist(optimalPoint, center);
    return createVector(optimalPoint.x - fromCenter, optimalPoint.y - fromCenter); 
  }
}
