import { file } from "../file"
import { command } from "../command"
import Path from "path"

interface IDockerImage {
  readonly name: string
  readonly os: string
}

interface IDockerProcedure {
  execute(context: DockerContext)
}

interface IDockerBuiltImage extends IDockerImage {
  from(image: string | IDockerImage): IDockerBuiltImage
  execute(procedure: IDockerProcedure): IDockerBuiltImage
  build()
}

class DockerImportImage implements IDockerImage {
  constructor(
    readonly name: string,
    readonly os: string,
  ) {
  }
}

class DockerBuiltImage implements IDockerBuiltImage {
  fromImage: IDockerImage
  context: DockerContext
  constructor(
    readonly name: string,
    readonly os: string,
  ) {
    this.context = new DockerContext(this)
  }
  from(image: string | IDockerImage): IDockerBuiltImage {
    this.fromImage = (typeof image === "string") ? docker.importImage(image, this.os) : image
    return this
  }
  execute(procedure: IDockerProcedure): IDockerBuiltImage {
    procedure.execute(this.context)
    return this
  }
  build() {
    this.context.terminate()
    command.call("docker", ["build", "-t", this.name, this.context.basePath])
  }
}

class DockerContext {
  installersImage: IDockerImage = null
  installersQueue: string[] = []
  buildQueue: string[] = []
  cleanQueue: string[] = []
  basePath: string
  constructor(readonly image: DockerBuiltImage) {
    this.basePath = "./.dockercontexts/" + image.name
  }
  resolve(...paths: string[]): string {
    return Path.resolve(this.basePath, ...paths)
  }
  terminate() {
    const dockerfile = []
    if (this.installersQueue.length) {
      const installersImage = this.installersImage || this.image.fromImage
      dockerfile.push(`FROM "${installersImage.name}" as installers`)
      dockerfile.push(...this.installersQueue)
    }
    dockerfile.push(`FROM "${this.image.fromImage.name}"`)
    dockerfile.push(...this.buildQueue)
    dockerfile.push(...this.cleanQueue)
    file.write.text(this.resolve("DockerFile"), dockerfile.join("\n"))
  }
}

class NodeInstaller implements IDockerProcedure {
  execute(context: DockerContext) {
    context.buildQueue.push(`RUN node C:/dockloader/nodejs/install.js`)
  }
}

export const docker = {
  createImage(name: string, os: string): IDockerBuiltImage {
    return new DockerBuiltImage(name, os)
  },
  importImage(name: string, os: string): IDockerImage {
    return new DockerImportImage(name, os)
  },
  installers: {
    node: new NodeInstaller(),
  }
}
